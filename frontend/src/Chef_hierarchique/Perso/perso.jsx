import React, { useState, useEffect } from "react";
import "./perso.css";

const App = () => {
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data from the backend API
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/Personnel/all");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setEmployees(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="app-container">
      {/* Header Section */}
      <div className="header">
        <div className="header-item">
          <span>Total Employees: {employees.length}</span>
        </div>
        <div className="header-item">
          <span>New Employees: 15</span>
        </div>
        <div className="header-item">
          <span>Male: {employees.filter(emp => emp.sexe === "male").length}</span>
        </div>
        <div className="header-item">
          <span>Female: {employees.filter(emp => emp.sexe === "female").length}</span>
        </div>
        <button className="add-btn">Add Employee</button>
      </div>

      {/* Table Section */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Employee Id</th>
              <th>Phone</th>
              <th>Join Date</th>
              <th>Department</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.slice(0, entriesPerPage).map((employee, index) => (
              <tr key={index}>
                <td>{`${employee.prenom} ${employee.nom}`}</td>
                <td>{employee.matricule}</td>
                <td>{employee.telephone}</td>
                <td>{employee.date_embauche}</td>
                <td>{employee.service ? employee.service.serviceName : "N/A"}</td>
                <td>
                  <button className="action-btn">...</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <label>Show Entries: </label>
          <select onChange={(e) => setEntriesPerPage(Number(e.target.value))}>
            <option value="10">10</option>
            <option value="15">15</option>
            <option value="20">20</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default App;