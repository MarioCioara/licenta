import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Teams = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:8000/api/teams/');
        setTeams(response.data);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError('Could not load teams.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="loading-text">Loading teams...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h2>Teams</h2>
        </div>
        <div className="alert alert-warning">{error}</div>
      </div>
    );
  }

  const countries = ['all', ...new Set(teams.map(team => team.country))].sort();
  const regions = ['all', ...new Set(teams.map(team => team.region_display || team.region))].sort();

  const filteredTeams = teams
    .filter(team => {
      const countryMatch = filterCountry === 'all' || team.country === filterCountry;
      const regionMatch = filterRegion === 'all' || (team.region_display || team.region) === filterRegion;
      return countryMatch && regionMatch;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Teams</h2>
        <p className="text-muted">
          Showing all League of Legends teams
        </p>
      </div>

      {/* Filter Section */}
      <div className="mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            <label htmlFor="countryFilter" className="form-label">Filter by Country</label>
            <select
              id="countryFilter"
              className="form-select"
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
            >
              {countries.map(country => (
                <option key={country} value={country}>
                  {country === 'all' ? 'All Countries' : country}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label htmlFor="regionFilter" className="form-label">Filter by Region</label>
            <select
              id="regionFilter"
              className="form-select"
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
            >
              {regions.map(region => (
                <option key={region} value={region}>
                  {region === 'all' ? 'All Regions' : region}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredTeams.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No teams found</p>
          <p className="empty-state-message">
            {teams.length === 0
              ? 'There are no teams in the database yet.'
              : 'No teams match the selected filters.'}
          </p>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {filteredTeams.map((team) => (
            <div key={team.id} className="col">
              <div
                className="card h-100"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/teams/${team.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate(`/teams/${team.id}`);
                  }
                }}
              >
                {team.logo ? (
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="card-img-top"
                    style={{
                      height: '200px',
                      objectFit: 'contain',
                      backgroundColor: (
                        team.name === 'Dplus KIA' ||
                        team.name === 'Oh My God' ||
                        team.name === 'Deep Cross Gaming' ||
                        team.name === 'DetonatioN FocusMe' ||
                        team.name === 'Fukuoka SoftBank HAWKS gaming' ||
                        team.name === 'Secret Whales'
                      ) ? '#FFFFFF' : '#000000',
                      padding: '20px'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    className="card-img-top d-flex align-items-center justify-content-center bg-light"
                    style={{ height: '200px' }}
                  >
                    <span className="text-muted">No Logo</span>
                  </div>
                )}
                <div className="card-body">
                  <h5 className="card-title">{team.name}</h5>
                  <p className="card-text text-muted small mb-1">
                    <strong>Country:</strong> {team.country}
                  </p>
                  <p className="card-text text-muted small mb-0">
                    <strong>Region:</strong> {team.region_display || team.region}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Teams;