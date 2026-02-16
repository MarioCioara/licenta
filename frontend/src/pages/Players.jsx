import React, { useEffect, useState } from 'react';
import api from '../config/api';
import { useNavigate } from 'react-router-dom';

const Players = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/api/players/');
        setPlayers(response.data);
      } catch (err) {
        console.error('Error fetching players:', err);
        setError('Could not load players.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="loading-text">Loading players...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h2>Players</h2>
        </div>
        <div className="alert alert-warning">{error}</div>
      </div>
    );
  }

  const filteredPlayers = players.filter(player => {
    const teamMatch = filterTeam === 'all' || player.team_name === filterTeam;
    const countryMatch = filterCountry === 'all' || player.country === filterCountry;
    const roleMatch = filterRole === 'all' || player.role === filterRole;
    return teamMatch && countryMatch && roleMatch;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) =>
    (a.nickname || '').localeCompare(b.nickname || '')
  );

  const uniqueTeams = ['all', ...new Set(players.map(p => p.team_name).filter(Boolean))].sort();
  const uniqueCountries = ['all', ...new Set(players.map(p => p.country).filter(Boolean))].sort();
  const uniqueRoles = ['all', ...new Set(players.map(p => p.role).filter(Boolean))].sort();

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Players</h2>
        <p className="text-muted">
          Showing all League of Legends players
        </p>
      </div>

      {players.length > 0 && (
        <div className="mb-4">
          <div className="d-flex flex-column flex-sm-row gap-3 mb-3">
            <div className="d-flex align-items-center gap-2">
              <label htmlFor="teamFilter" className="mb-0 text-muted small" style={{ minWidth: '60px' }}>
                Team:
              </label>
              <select
                id="teamFilter"
                className="form-select form-select-sm"
                style={{ width: 'auto', minWidth: '180px' }}
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                aria-label="Filter by team"
              >
                <option value="all">All Teams</option>
                {uniqueTeams.filter(t => t !== 'all').map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>

            <div className="d-flex align-items-center gap-2">
              <label htmlFor="countryFilter" className="mb-0 text-muted small" style={{ minWidth: '60px' }}>
                Country:
              </label>
              <select
                id="countryFilter"
                className="form-select form-select-sm"
                style={{ width: 'auto', minWidth: '180px' }}
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                aria-label="Filter by country"
              >
                <option value="all">All Countries</option>
                {uniqueCountries.filter(c => c !== 'all').map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div className="d-flex align-items-center gap-2">
              <label htmlFor="roleFilter" className="mb-0 text-muted small" style={{ minWidth: '60px' }}>
                Role:
              </label>
              <select
                id="roleFilter"
                className="form-select form-select-sm"
                style={{ width: 'auto', minWidth: '180px' }}
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                aria-label="Filter by role"
              >
                <option value="all">All Roles</option>
                {uniqueRoles.filter(r => r !== 'all').map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-muted small mb-0">
            Showing {sortedPlayers.length} of {players.length} player{players.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {players.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No players found</p>
          <p className="empty-state-message">
            There are no players in the database yet.
          </p>
        </div>
      ) : sortedPlayers.length === 0 ? (
        <div className="alert alert-info">
          <p className="mb-0">No players match the selected filters. Try adjusting your filter criteria.</p>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
          {sortedPlayers.map((player) => (
            <div key={player.id} className="col">
              <div
                className="card h-100"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/players/${player.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate(`/players/${player.id}`);
                  }
                }}
              >
                <div className="card-body">
                  <h5 className="card-title">{player.nickname}</h5>
                  <p className="card-text text-muted small">
                    <strong>Name:</strong> {player.real_name}
                  </p>
                  <p className="card-text text-muted small">
                    <strong>Role:</strong> {player.role}
                  </p>
                  <p className="card-text text-muted small">
                    <strong>Country:</strong> {player.country}
                  </p>
                  {player.team_name && (
                    <p className="card-text text-muted small">
                      <strong>Team:</strong> {player.team_name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Players;
