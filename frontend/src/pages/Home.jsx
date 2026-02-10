import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

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

const Home = () => {
  const navigate = useNavigate();
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ teams: [], players: [], tournaments: [] });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchUpcomingMatches = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:8000/api/matches/');
        const now = new Date();

        const upcoming = response.data
          .filter(match => new Date(match.date_time) > now)
          .sort((a, b) => new Date(a.date_time) - new Date(b.date_time))
          .slice(0, 8);

        setUpcomingMatches(upcoming);
      } catch (err) {
        console.error('Error fetching matches:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingMatches();
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults({ teams: [], players: [], tournaments: [] });
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/search/?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(response.data);
        setShowSearchResults(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearchResultClick = (type, id) => {
    setSearchQuery('');
    setShowSearchResults(false);
    navigate(`/${type}/${id}`);
  };

  const totalResults = searchResults.teams.length + searchResults.players.length + searchResults.tournaments.length;

  return (
    <div className="container mt-4 fade-in">
      {/* Hero Section */}
      <div className="text-center py-5">
        <h1 className="text-gradient-cyber mb-3">Welcome to Rift Pulse</h1>
        <p className="lead text-secondary mb-4">Your premier source for League of Legends esports information</p>

        {/* Search Bar */}
        <div className="position-relative mx-auto mb-4" style={{ maxWidth: '600px' }}>
          <div className="input-group input-group-lg">
            <span className="input-group-text bg-dark border-secondary">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control bg-dark text-white border-secondary"
              placeholder="Search teams, players, or tournaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
            />
            {searchQuery && (
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchQuery.length >= 2 && (
            <div className="position-absolute w-100 mt-2 bg-dark border border-secondary rounded shadow-lg" style={{ zIndex: 1000, maxHeight: '400px', overflowY: 'auto' }}>
              {searchLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Searching...</span>
                  </div>
                  <p className="text-muted small mb-0 mt-2">Searching...</p>
                </div>
              ) : totalResults === 0 ? (
                <div className="p-3 text-center text-muted">
                  <i className="bi bi-search mb-2" style={{ fontSize: '2rem' }}></i>
                  <p className="mb-0">No results found for "{searchQuery}"</p>
                </div>
              ) : (
                <>
                  {/* Teams */}
                  {searchResults.teams.length > 0 && (
                    <div className="border-bottom border-secondary">
                      <div className="px-3 py-2 bg-secondary bg-opacity-25">
                        <small className="text-muted fw-bold">TEAMS ({searchResults.teams.length})</small>
                      </div>
                      {searchResults.teams.map(team => (
                        <div
                          key={team.id}
                          className="p-3 border-bottom border-secondary search-result-item"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSearchResultClick('teams', team.id)}
                        >
                          <div className="d-flex align-items-center">
                            {team.logo && (
                              <img
                                src={team.logo}
                                alt={team.name}
                                style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                                className="me-3"
                              />
                            )}
                            <div>
                              <div className="fw-bold">{team.name}</div>
                              <small className="text-muted">{team.country} • {team.region_display}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Players */}
                  {searchResults.players.length > 0 && (
                    <div className="border-bottom border-secondary">
                      <div className="px-3 py-2 bg-secondary bg-opacity-25">
                        <small className="text-muted fw-bold">PLAYERS ({searchResults.players.length})</small>
                      </div>
                      {searchResults.players.map(player => (
                        <div
                          key={player.id}
                          className="p-3 border-bottom border-secondary search-result-item"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSearchResultClick('players', player.id)}
                        >
                          <div className="fw-bold">{player.nickname}</div>
                          <small className="text-muted">
                            {player.real_name && `${player.real_name} • `}
                            {player.role} • {player.team_name || 'Free Agent'}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tournaments */}
                  {searchResults.tournaments.length > 0 && (
                    <div>
                      <div className="px-3 py-2 bg-secondary bg-opacity-25">
                        <small className="text-muted fw-bold">TOURNAMENTS ({searchResults.tournaments.length})</small>
                      </div>
                      {searchResults.tournaments.map(tournament => (
                        <div
                          key={tournament.id}
                          className="p-3 border-bottom border-secondary search-result-item"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSearchResultClick('tournaments', tournament.id)}
                        >
                          <div className="fw-bold">{tournament.name}</div>
                          <small className="text-muted">
                            {tournament.location} • {tournament.region_display}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="d-flex gap-3 justify-content-center">
          <Link to="/regions" className="btn btn-primary btn-lg">
            Explore Regions →
          </Link>
          <Link to="/tournaments" className="btn btn-secondary btn-lg">
            View Tournaments
          </Link>
        </div>
      </div>

      {/* Upcoming Matches Section */}
      <div className="mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Upcoming Matches</h3>
          <Link to="/matches" className="btn btn-outline-primary btn-sm">
            View All Matches →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-2">Loading upcoming matches...</p>
          </div>
        ) : upcomingMatches.length === 0 ? (
          <div className="alert alert-info">
            <p className="mb-0">No upcoming matches scheduled at the moment.</p>
          </div>
        ) : (
          <div className="row g-3">
            {upcomingMatches.map((match) => (
              <div key={match.id} className="col-12 col-md-6 col-lg-3">
                <div className="card h-100 match-card">
                  <div className="card-body">
                    <div className="mb-3">
                      <p className="text-muted small mb-1">
                        <i className="bi bi-calendar-event me-1"></i>
                        {formatDate(match.date_time)}
                      </p>
                      {match.stats?.block_name && (
                        <p className="text-muted small mb-0">
                          <i className="bi bi-trophy me-1"></i>
                          {match.stats.block_name}
                        </p>
                      )}
                    </div>

                    <div className="text-center mb-3">
                      <h6 className="mb-2">
                        {match.team1_name}
                        <div className="text-muted small">vs</div>
                        {match.team2_name}
                      </h6>
                    </div>

                    {match.tournament_name && (
                      <div className="mt-auto">
                        <p className="text-muted small mb-0 text-center">
                          <span className="badge bg-secondary">{match.tournament_name}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
