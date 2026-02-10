import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const result = await register(
      formData.username,
      formData.email,
      formData.password,
      formData.password2
    );

    if (result.success) {
      navigate('/');
    } else {
      setErrors(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card bg-dark border-secondary">
            <div className="card-body p-4">
              <h2 className="text-center mb-4 text-gradient-cyber">Register</h2>

              {errors.non_field_errors && (
                <div className="alert alert-danger" role="alert">
                  {errors.non_field_errors}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">Username</label>
                  <input
                    type="text"
                    className={`form-control bg-dark text-white border-secondary ${errors.username ? 'is-invalid' : ''}`}
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                  {errors.username && (
                    <div className="invalid-feedback">{errors.username[0]}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className={`form-control bg-dark text-white border-secondary ${errors.email ? 'is-invalid' : ''}`}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email[0]}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control bg-dark text-white border-secondary ${errors.password ? 'is-invalid' : ''}`}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-light"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                    </button>
                  </div>
                  {errors.password && (
                    <div className="text-danger small mt-1">{errors.password[0]}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="password2" className="form-label">Confirm Password</label>
                  <div className="input-group">
                    <input
                      type={showPassword2 ? 'text' : 'password'}
                      className={`form-control bg-dark text-white border-secondary ${errors.password2 ? 'is-invalid' : ''}`}
                      id="password2"
                      name="password2"
                      value={formData.password2}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-light"
                      onClick={() => setShowPassword2(!showPassword2)}
                      title={showPassword2 ? 'Hide password' : 'Show password'}
                    >
                      <i className={`bi bi-eye${showPassword2 ? '-slash' : ''}`}></i>
                    </button>
                  </div>
                  {errors.password2 && (
                    <div className="text-danger small mt-1">{errors.password2[0]}</div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Register'}
                </button>

                <p className="text-center text-muted mb-0">
                  Already have an account? <Link to="/login" className="text-primary">Login</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
