import React, { useEffect, useState, useContext } from 'react';
import api from '../config/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const sortMatches = (matchesArray, option) => {
  const sorted = [...matchesArray];

  switch (option) {
    case 'date-asc':
      return sorted.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
    case 'date-desc':
    default:
      return sorted.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
  }
};

const Matches = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, toggleFavoriteMatch } = useContext(AuthContext);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('date-desc');
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [filterRegion, setFilterRegion] = useState('all');

  const toggleMatchStats = (matchId) => {
    setExpandedMatch(expandedMatch === matchId ? null : matchId);
  };

  const handleTeamClick = (e, teamId) => {
    e.stopPropagation();
    navigate(`/teams/${teamId}`);
  };

  const handleToggleFavorite = async (matchId, e) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await toggleFavoriteMatch(matchId);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const isFavoriteMatch = (matchId) => {
    return user?.favorite_matches?.includes(matchId);
  };

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/api/matches/');
        setMatches(response.data);
      } catch (err) {
        console.error('Error fetching matches:', err);
        setError('Could not load matches.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="loading-text">Loading matches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h2>Matches</h2>
        </div>
        <div className="alert alert-warning">{error}</div>
      </div>
    );
  }

  const regions = ['all', ...new Set(matches.map(m => m.tournament_region).filter(Boolean))].sort();

  const filteredMatches = filterRegion === 'all'
    ? matches
    : matches.filter(m => m.tournament_region === filterRegion);

  const sortedMatches = sortMatches(filteredMatches, sortOption);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Matches</h2>
        <p className="text-muted">
          Recent League of Legends matches from all regions
        </p>
      </div>
      {matches.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No matches found</p>
          <p className="empty-state-message">
            There are no matches in the database yet.
          </p>
        </div>
      ) : (
        <div className="mb-3">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
            <p className="text-muted mb-0">
              Showing {sortedMatches.length} of {matches.length} match{matches.length !== 1 ? 'es' : ''}
            </p>
            <div className="d-flex flex-wrap align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <label htmlFor="regionFilter" className="mb-0 text-muted small">
                  Region:
                </label>
                <select
                  id="regionFilter"
                  className="form-select form-select-sm"
                  style={{ width: 'auto', minWidth: '150px' }}
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  aria-label="Filter by region"
                >
                  {regions.map(region => (
                    <option key={region} value={region}>
                      {region === 'all' ? 'All Regions' : region}
                    </option>
                  ))}
                </select>
              </div>
              <div className="d-flex align-items-center gap-2">
                <label htmlFor="sortSelect" className="mb-0 text-muted small">
                  Sort by:
                </label>
                <select
                  id="sortSelect"
                  className="form-select form-select-sm"
                  style={{ width: 'auto', minWidth: '180px' }}
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  aria-label="Sort matches"
                >
                  <option value="date-desc">Date (Newest First)</option>
                  <option value="date-asc">Date (Oldest First)</option>
                </select>
              </div>
            </div>
          </div>
          <div className="row g-3">
            {sortedMatches.map((match) => {
              const isUpcoming = !match.result && (!match.stats?.state || match.stats.state === 'unstarted');
              return (
                <div key={match.id} className="col-12">
                  <div className="card">
                    <div
                      className="card-body"
                      style={{ cursor: match.stats?.games ? 'pointer' : 'default' }}
                      onClick={() => match.stats?.games && toggleMatchStats(match.id)}
                    >
                      <div className="row align-items-center">
                        <div className="col-md-4">
                          <p className="text-muted small mb-1">
                            {formatDate(match.date_time)}
                          </p>
                          {match.stats?.block_name && (
                            <p className="text-muted small mb-0">
                              {match.stats.block_name}
                            </p>
                          )}
                        </div>
                        <div className="col-md-4 text-center">
                          <h5 className="mb-1">
                            <span
                              className={!isUpcoming && match.result?.includes(match.team1_name) ? 'text-success fw-bold' : ''}
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => handleTeamClick(e, match.team1)}
                            >
                              {match.team1_name}
                            </span>
                            {' vs '}
                            <span
                              className={!isUpcoming && match.result?.includes(match.team2_name) ? 'text-success fw-bold' : ''}
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => handleTeamClick(e, match.team2)}
                            >
                              {match.team2_name}
                            </span>
                          </h5>
                          <p className="mb-0">
                            {isUpcoming ? (
                              <span className="badge bg-info">Schedule (unstarted)</span>
                            ) : (
                              <span className="badge bg-secondary">
                                {match.score && match.score !== '0-0' ? match.score : match.result || 'Completed'}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="col-md-4 text-md-end">
                          <p className="text-muted small mb-1">
                            {isUpcoming ? '' : match.result}
                          </p>
                        <div className="d-flex gap-2 justify-content-md-end flex-wrap">
                          <button
                            className={`btn btn-sm ${isFavoriteMatch(match.id) ? 'btn-warning' : 'btn-outline-warning'}`}
                            onClick={(e) => handleToggleFavorite(match.id, e)}
                            title={isFavoriteMatch(match.id) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <i className={`bi bi-star${isFavoriteMatch(match.id) ? '-fill' : ''} me-1`}></i>
                            {isFavoriteMatch(match.id) ? 'Favorited' : 'Favorite'}
                          </button>
                          {match.vod_link && match.vod_link !== 'https://lolesports.com' && (
                            <a
                              href={match.vod_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Watch VOD
                            </a>
                          )}
                          {!isUpcoming && match.stats?.games && (
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMatchStats(match.id);
                              }}
                            >
                              {expandedMatch === match.id ? 'Hide Details' : 'Show Details'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Game Info Section */}
                  {expandedMatch === match.id && match.stats?.games && (
                    <div className="card-body border-top bg-dark">
                      <h6 className="mb-3">Game Details</h6>
                      <div className="row g-3">
                        {match.stats.games.map((game, gameIndex) => (
                          <div key={game.id || gameIndex} className="col-md-6">
                            <div className="card h-100">
                              <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                  <h6 className="mb-0 text-muted">Game {game.number}</h6>
                                  <span className={`badge ${game.state === 'completed' ? 'bg-success' : game.state === 'unneeded' ? 'bg-secondary' : 'bg-warning'}`}>
                                    {game.state}
                                  </span>
                                </div>
                                {game.teams?.map((team, teamIndex) => (
                                  <div key={teamIndex} className="mb-2">
                                    <div className="d-flex align-items-center justify-content-between">
                                      <div>
                                        <span className="fw-bold">{team.name || team.code || 'Unknown'}</span>
                                      </div>
                                      <span className={`badge ${team.side === 'blue' ? 'bg-primary' : 'bg-danger'}`}>
                                        {team.side}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                                {game.state === 'unneeded' && (
                                  <p className="text-muted small mb-0 mt-2">Game not played</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Matches;
