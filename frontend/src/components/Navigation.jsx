import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

const Navigation = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const closeNav = () => setIsOpen(false);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/" onClick={closeNav}>Rift Pulse</Link>
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-controls="navbarContent"
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`} id="navbarContent">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/regions" onClick={closeNav}>Regions</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/teams" onClick={closeNav}>Teams</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/players" onClick={closeNav}>Players</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/tournaments" onClick={closeNav}>Tournaments</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/matches" onClick={closeNav}>Matches</Link>
            </li>
          </ul>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-light btn-sm glow-on-hover"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>

            {isAuthenticated ? (
              <>
                <Link to="/profile" className="btn btn-outline-primary btn-sm">
                  <i className="bi bi-person-circle me-1"></i>
                  {user?.username}
                </Link>
                <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">
                  <i className="bi bi-box-arrow-right me-1"></i>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-primary btn-sm">
                  <i className="bi bi-box-arrow-in-right me-1"></i>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  <i className="bi bi-person-plus me-1"></i>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;