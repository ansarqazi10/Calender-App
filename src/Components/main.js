import { useState, useEffect } from "react";
import axios from "axios";
import swal from "sweetalert";

function Main() {
  let [name, setName] = useState("");
  let [email, setEmail] = useState("");
  let [password, setPassword] = useState("");
  let [title, setTitle] = useState("");
  let [description, setDescription] = useState("");
  let [date, setDate] = useState("");
  let [isPublic, setIsPublic] = useState("0");
  let [users, setUsers] = useState([]);
  let [error, setError] = useState("");
  let [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem("currentUser")) || {});
  let [allowedUsers, setAllowedUsers] = useState([]);
  const [checkedState, setCheckedState] = useState([]);

  let [data, setData] = useState([]);
  let [saved, setSaved] = useState([]);
  let [searchText, setSearchText] = useState("");
  let [searchDate, setSearchDate] = useState("");
  let [toEditId, setToEditId] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5050/users")
      .then((res) => {
        setUsers(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    let k = Array.from({ length: users.length }, (_, i) => false);
    setCheckedState(k);
  }, [users.length]);

  const handleOnChange = (position) => {
    const updatedCheckedState = checkedState.map((item, index) =>
      index === position ? !item : item
    );

    let checked = [];
    for (let i = 0; i < users.length; i++) {
      if (updatedCheckedState[i] === true) {
        checked.push(users[i]);
      }
    }
    setAllowedUsers(checked);
    setCheckedState(updatedCheckedState);
  };

  const signup = () => {
    if (name === "" || name === undefined) {
      setError("Please enter your name.");
      return;
    }
    if (email === "" || email === undefined) {
      setError("Please enter your email.");
      return;
    }
    if (password === "" || password === undefined) {
      setError("Please enter your password.");
      return;
    }
    let obj = { name, email, password, isAdmin: false, loginDate: Date.now() };
    axios
      .post("http://localhost:5050/users", obj)
      .then((res) => {
        localStorage.setItem("currentUser", JSON.stringify(res.data));
        setCurrentUser(res.data);
        document.getElementById("signupBtn").click();
        swal({
          title: "Success",
          text: "You have successfully created an accout.",
          icon: "success",
        });
        clearForm();
        setTimeout(() => {
          window.location.reload();
        }, 500);
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  const login = () => {
    if (email === "" || email === undefined) {
      setError("Please enter your email.");
      return;
    }
    if (password === "" || password === undefined) {
      setError("Please enter your password.");
      return;
    }
    if (isValidEmail(email) === false) {
      setError("Please enter a valid email.");
      return;
    }
    axios
      .post("http://localhost:5050/users/getByEmail", { email, password })
      .then((res) => {
        localStorage.setItem("currentUser", JSON.stringify(res.data));
        setCurrentUser(res.data);
        document.getElementById("loginBtn").click();
        clearForm();
        setTimeout(() => {
          window.location.reload();
        }, 500);
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const createEvent = () => {
    if (title === "" || title === undefined) {
      setError("Please enter event title.");
      return;
    }
    if (description === "" || description === undefined) {
      setError("Please enter event description.");
      return;
    }
    if (date === "" || date === undefined) {
      setError("Please enter event date.");
      return;
    }

    let obj = { title, description, date, allowedUsers };

    if(toEditId === "") {
    axios
      .post("http://localhost:5050/events", obj)
      .then((res) => {
        document.getElementById("eventCloseBtn").click();
        swal({
          title: "Success",
          text: "The Event has been created.",
          icon: "success",
        });
        setTimeout(() => {
          window.location.reload();
        }, 500);
      })
      .catch((err) => console.log(err));
    } else {
      axios
      .put(`http://localhost:5050/events/${toEditId}`, obj)
      .then((res) => {
        setToEditId("");
          window.location.reload();
      })
      .catch((err) => console.log(err));
    }

  };

  const logout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser({});
    window.location.reload();
  };

  const clearForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setDate("");
    setError("");
  };

  // Events Related Functions
  useEffect(() => {
    axios
      .get("http://localhost:5050/events")
      .then((res) => {
        if (currentUser._id === undefined || currentUser._id === "") {
          let publicData = [];
          res.data.forEach((elem) => {
            if (elem.allowedUsers.length === 0) {
              publicData.push(elem);
            }
          });
          setData(publicData);
          setSaved(publicData);
          return;
        }
        if (
          currentUser.email === "admin@calendarapp.com" &&
          currentUser.password === "Admin@123"
        ) {
          setData(res.data);
          setSaved(res.data);
          return;
        }

        let myData = [];
        res.data.forEach((elem) => {
          if (elem.allowedUsers.length === 0) {
            myData.push(elem);
            return;
          }
          elem.allowedUsers.forEach((el) => {
            if (el._id === currentUser._id) myData.push(elem);
          });
        });
        setData(myData);
        setSaved(myData);
      })
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    if (searchText.length === 0) {
      setData(saved);
      return;
    }
    data = saved;
    searchText = searchText.toLowerCase();
    let k = data.filter(
      (x) =>
        x.title.toLowerCase().includes(searchText) ||
        x.description.toLowerCase().includes(searchText)
    );
    setData(k);
  }, [searchText.length]);

  useEffect(() => {
    data = saved;
    if (searchDate === "") {
      setData(saved);
      return;
    }
    let k = data.filter((x) => x.date.split("T")[0] === searchDate);
    setData(k);
  }, [searchDate]);

  const clearSeach = () => {
    setSearchText("");
    setSearchDate("");
    setData(saved);
  };

  const editEvent = (id) => {
    let elem = data.find(el => el._id === id);
    setTitle(elem.title);
    setDescription(elem.description);
    setAllowedUsers(elem.allowedUsers);
    setDate(elem.date);
    setToEditId(elem._id);
  };

  const deleteEvent = (id) => {
    swal({
      title: "Are you sure?",
      text: "Are you sure and want to delete this event.",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    })
    .then((willDelete) => {
      if (willDelete) {
        axios
        .delete(`http://localhost:5050/events/${id}`)
        .then((res) => {
          window.location.reload();
      })
        .catch((err) => console.log(err));
      }
    });
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <button className="navbar-brand btn btn-dark"><i class="fa fa-calendar" aria-hidden="true"></i> &nbsp; Calender App</button>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="google.comnavbarContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {currentUser.isAdmin && (
              <li className="nav-item">
                <button
                  className="navbar-brand btn btn-dark"
                  data-toggle="modal"
                  data-target="#eventModal"
                >
                  Create New Event
                </button>
              </li>
            )}
            {currentUser._id && (
              <li className="nav-item">
                <button
                  className="navbar-brand btn btn-dark"
                  style={{ color: "red" }}
                  onClick={logout}
                >
                  Logout
                </button>
              </li>
            )}
          </ul>
          {currentUser._id ? (
            <h2 style={{ color: "white" }}>{currentUser.name}</h2>
          ) : (
            <ul className="navbar-nav">
              <li className="nav-item">
                <button
                  className="navbar-brand btn btn-dark"
                  type="button"
                  data-toggle="modal"
                  data-target="#signupModal"
                >
                  Signup
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="navbar-brand btn btn-dark"
                  type="button"
                  data-toggle="modal"
                  data-target="#loginModal"
                >
                  Login
                </button>
              </li>
            </ul>
          )}
        </div>
      </nav>
      {/* Signup Modal */}
      <div
        className="modal fade"
        id="signupModal"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                Signup
              </h5>
              <button
                type="button"
                id="signupBtn"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    aria-describedby="emailHelp"
                    placeholder="Enter Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email1"
                    aria-describedby="emailHelp"
                    placeholder="Enter Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password1"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <p style={{ color: "red" }}>{error}</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={signup}
              >
                Signup
              </button>
            </div>
            <p style={{ textAlign: "center" }}>
              Already have an accout, login &nbsp;
              <span
                data-toggle="modal"
                data-target="#loginModal"
                data-dismiss="modal"
                aria-label="Close"
                style={{ cursor: "pointer", color: "blue" }}
              >
                here
              </span>
            </p>
          </div>
        </div>
      </div>
      {/* Login Modal */}
      <div
        className="modal fade"
        id="loginModal"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">
                Login
              </h5>
              <button
                type="button"
                id="loginBtn"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form>
                <div className="form-group">
                  <label htmlFor="email">Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email2"
                    aria-describedby="emailHelp"
                    placeholder="Enter Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password2"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <p style={{ color: "red" }}>{error}</p>
              <button type="button" className="btn btn-primary" onClick={login}>
                Login
              </button>
            </div>
            <p style={{ textAlign: "center" }}>
              If you are new here, click &nbsp;
              <span
                data-toggle="modal"
                data-target="#signupModal"
                data-dismiss="modal"
                aria-label="Close"
                style={{ cursor: "pointer", color: "blue" }}
              >
                here
              </span>
              &nbsp; to create an account
            </p>
          </div>
        </div>
      </div>
      {/* Create New Event Modal */}
      <div
        className="modal fade"
        id="eventModal"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="eventModal"
        aria-hidden="true"
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="eventModal">
                Create New Event
              </h5>
              <button
                id="eventCloseBtn"
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <form>
                <div className="form-group">
                  <label htmlFor="title">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    aria-describedby="emailHelp"
                    placeholder="Enter Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    id="description"
                    placeholder="Enter Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="date">Event Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="date"
                    placeholder="Enter Date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ height: "50px" }}>
                  <label>Is this event public or private?</label>
                  <select
                    className="form-control"
                    value={isPublic}
                    onChange={(e) => setIsPublic(e.target.value)}
                  >
                    <option value="0">Select Type</option>
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                  </select>
                  <br />

                  {isPublic === "Private" && (
                    <>
                      <label htmlFor="users">
                        Select users who can see this event
                      </label>
                      {users.map((elem, idx) => {
                        return (
                          <>{elem.email !== "admin@calendarapp.com" && elem.password !== "Admin@123" && <div className="checkBox" key={idx}>
                            <label className="form-check-label">
                              {elem.name}
                            </label>
                            <input
                              className="form-check-input"
                              style={{ float: "right" }}
                              type="checkbox"
                              name={elem._id}
                              value={elem._id}
                              checked={checkedState[idx]}
                              onChange={() => handleOnChange(idx)}
                            />
                          </div>}</>
                        );
                      })}
                    </>
                  )}
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <p style={{ color: "red" }}>{error}</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={createEvent}
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Events Rendering */}
      <div className="row">
        <div className="col-5">
          <label>Search with any text</label>
          <input
            type="text"
            className="form-control"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Enter any text to search from last months events"
          />
        </div>
        <div className="col-5">
          <label>Search with date</label>
          <input
            type="date"
            className="form-control"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
          />
        </div>
        <div className="col-2">
          <label>Click here to clear both searches</label>
          <button className="btn btn-dark btn-lg" onClick={clearSeach}>
            Clear Search
          </button>
        </div>
      </div>
      <h1 className="m-4">{currentUser._id ? "All Events" : "Public Events"}</h1>
      <div className="row">
        {data.map((elem, idx) => {
          return (
            <div className="col-3 event" key={idx}>
              {elem.allowedUsers.length === 0 && (
                <span className="badge bg-dark" style={{ float: "right" }}>
                  PUBLIC
                </span>
              )}
              <h2>{elem.title}</h2>
              <p className="des">{elem.description}</p>
              <h5>{elem.date.split("T")[0]}</h5>
              {currentUser.isAdmin && (
                <div>
                  <button
                    className="btn btn-dark btn-sm"
                    data-toggle="modal"
                    data-target="#eventModal"
                    onClick={() => editEvent(elem._id)}
                  >
                    Edit
                  </button>{" "}
                  &nbsp;
                  <button
                    className="btn btn-dark btn-sm"
                    onClick={() => deleteEvent(elem._id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default Main;