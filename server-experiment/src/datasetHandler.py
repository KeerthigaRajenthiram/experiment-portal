import pymongo
import json
import time
import calendar
from dbClient import mongo_client
from projectHandler import projectHandler
import zenoh
import os
import io
import zipfile
import pylibmagic
import magic
import hashlib

class DatasetHandler(object):
    def __init__(self):
        self.client = mongo_client
        self.db = self.client.experiments
        self.collection_dataset = self.db.dataset
        self.zenoh_session = zenoh.open(zenoh.Config.from_file("zenoh-client.json5"))
        self.zenoh_key_expr = "projects/{proj_id}/datasets/{dataset_id}"

    def get_datasets(self, proj_id):
        query = {"project_id": proj_id}
        documents = self.collection_dataset.find(query).sort("update_at", pymongo.DESCENDING)
        return json.loads(json.dumps(list(documents), default=str))

    def dataset_exists(self, dataset_id):
        query = {"id_dataset": dataset_id}
        documents = self.collection_dataset.find(query)
        for doc in documents:
            if doc["id_dataset"] == dataset_id:
                return True
        return False

    def get_dataset(self, dataset_id):
        query = {"id_dataset": dataset_id}
        documents = self.collection_dataset.find(query)
        return json.loads(json.dumps(documents[0], default=str))

    def create_dataset(self, username, proj_id, dataset_name, dataset_content, description, metadata):
        try:
            create_time = calendar.timegm(time.gmtime())
            dataset_id = f"{username}_{dataset_name.replace(' ', '')}_{create_time}"
            key_expr = self.zenoh_key_expr.format(proj_id=proj_id, dataset_id=dataset_id)
            zenoh_node = "tcp/zenoh1:7447"
            try:
                pub = self.zenoh_session.declare_publisher(key_expr)
                pub.put(dataset_content)
            except Exception as e:
                print(f"Failed to publish dataset to Zenoh: {e}")
            
            mime = magic.Magic(mime=True)
            file_type = mime.from_buffer(dataset_content)
            hasher = hashlib.sha1()
            hasher.update(dataset_content)
            file_hash = hasher.hexdigest()
            file_size = len(dataset_content)
            query = {
                "id_dataset": dataset_id,
                "project_id": proj_id,
                "name": dataset_name,
                "description": description,
                "create_at": create_time,
                "update_at": create_time,
                "metadata": metadata, 
                "file_hash": file_hash,
                "file_type": file_type,
                "file_size": file_size,
                "zenoh_node": zenoh_node,
                "zenoh_key_expr": key_expr
            }
            try:
                self.collection_dataset.insert_one(query)
            except Exception as e:
                print(f"Failed to insert dataset into MongoDB: {e}")
            
            try:
                projectHandler.update_project_update_at(proj_id)
            except Exception as e:
                print(f"Failed to update project update_at: {e}")

            return dataset_id
        except Exception as e:
            print(f"Failed to create dataset: {e}")
            return None

    def delete_dataset(self, dataset_id, proj_id):
        query = {"id_dataset": dataset_id}
        self.collection_dataset.delete_one(query)

        key_expr = self.zenoh_key_expr.format(proj_id=proj_id, dataset_id=dataset_id)
        try:
            self.zenoh_session.delete(key_expr)
        except Exception as e:
            print(f"Failed to delete dataset from Zenoh: {e}")

        projectHandler.update_project_update_at(proj_id)

    def delete_datasets(self, proj_id):
        query = {"project_id": proj_id}
        self.collection_dataset.delete_many(query)
        key_expr = self.zenoh_key_expr.format(proj_id=proj_id, dataset_id="*")
        try:
            self.zenoh_session.delete(key_expr)
        except Exception as e:
            print(f"Failed to delete datasets from Zenoh: {e}")

    def detect_duplicate(self, proj_id, dataset_name):
        query = {"project_id": proj_id, "name": dataset_name}
        documents = self.collection_dataset.find(query)
        for doc in documents:
            if doc["name"] == dataset_name:
                return True
        return False

    def update_dataset_name(self, dataset_id, proj_id, dataset_name):
        update_time = calendar.timegm(time.gmtime())
        query = {"id_dataset": dataset_id}
        new_values = {"$set": {"name": dataset_name, "update_at": update_time}}
        self.collection_dataset.update_one(query, new_values)

        projectHandler.update_project_update_at(proj_id)
        return True

    def update_dataset_description(self, dataset_id, proj_id, dataset_description):
        update_time = calendar.timegm(time.gmtime())
        query = {"id_dataset": dataset_id}
        new_values = {"$set": {"description": dataset_description, "update_at": update_time}}
        self.collection_dataset.update_one(query, new_values)

        projectHandler.update_project_update_at(proj_id)
        return True

    def download_dataset(self, proj_id, dataset_id):
        key_expr = self.zenoh_key_expr.format(proj_id=proj_id, dataset_id=dataset_id)
        try:
            replies = self.zenoh_session.get(key_expr, zenoh.ListCollector())
            file_content = None
            for reply in replies():
                if reply.ok:
                    file_content = reply.ok.payload
                    break
            if file_content:
                # Detect MIME type
                mime = magic.Magic()
                mime_type = mime.from_buffer(file_content)
                return {
                    'content': io.BytesIO(file_content),
                    'mime_type': mime_type
                }
            else:
                print(f"Dataset {dataset_id} not found in Zenoh.")
                return None
        except Exception as e:
            print(f"Failed to download dataset from Zenoh: {e}")
            return None
        
    def download_datasets(self, proj_id):
        key_expr = f"projects/{proj_id}/datasets/*"
        zipname = f"{proj_id}_datasets.zip"
        file_list = []
        try:
            replies = self.zenoh_session.get(key_expr, zenoh.ListCollector())
            in_memory_zip = io.BytesIO()
            with zipfile.ZipFile(in_memory_zip, mode="w") as zf:
                for reply in replies:
                    if reply.ok:
                        file_name = str(reply.ok.key_expr)
                        file_content = reply.ok.payload
                        zf.writestr(file_name.replace("/", "-"), file_content)
                        file_list.append(file_name)
            in_memory_zip.seek(0)
            return {"zip_file": in_memory_zip, "zip_name": zipname}
        except Exception as e:
            print(f"Failed to download datasets from Zenoh: {e}")
            return None

datasetHandler = DatasetHandler()
