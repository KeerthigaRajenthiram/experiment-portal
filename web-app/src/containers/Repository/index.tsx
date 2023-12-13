import "./style.scss";

import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";

const Repository = () => {
  const location = useLocation();
  const isExperiment = location.pathname.includes("/experiments");
  const experimentSelectedClass = isExperiment ? "selected" : "";
  const userSelectedClass = isExperiment ? "" : "selected";

  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/account/login");
  };

  return (
    <div className="page repository">
      <div className="repository__panel">
        <div className="repository__panel__header">
          <span>Repository</span>
        </div>
        <div className="repository__panel__items">
          <Link
            to={`/repository/${localStorage.getItem("username")}/experiments`}
          >
            <div
              className={`repository__panel__items__item ${experimentSelectedClass}`}
            >
              <span className="iconfont">&#xe6cf;</span>
              <p>Experiments</p>
            </div>
          </Link>
          <Link to={`/repository/${localStorage.getItem("username")}/user`}>
            <div
              className={`repository__panel__items__item ${userSelectedClass}`}
            >
              <span className="iconfont">&#xe63d;</span>
              <p>User</p>
            </div>
          </Link>
        </div>
        <div className="repository__panel__sign-out">
          <button
            className="repository__panel__sign-out__button"
            onClick={handleSignOut}
          >
            sign out
          </button>
        </div>
      </div>
      <div className="repository__content">
        <Outlet />
      </div>
    </div>
  );
};

export default Repository;
