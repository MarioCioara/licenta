import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../config/api';

const Profile = () => {
  const { user, isAuthenticated, loading, toggleFavoriteTeam, toggleFavoriteMatch, deleteAccount } = useContext(AuthContext);
  const navigate = useNavigate();
  const [favoriteTeams, setFavoriteTeams] = useState([]);
  const [favoriteMatches, setFavoriteMatches] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;

      try {
        const teamsPromises = user.favorite_teams.map(teamId =>
          api.get(`/api/teams/${teamId}/`)
        );
        const teamsResponses = await Promise.all(teamsPromises);
        setFavoriteTeams(teamsResponses.map(res => res.data));

        const matchesPromises = user.favorite_matches.map(matchId =>
          api.get(`/api/matches/${matchId}/`)
        );
        const matchesResponses = await Promise.all(matchesPromises);
        setFavoriteMatches(matchesResponses.map(res => res.data));
      } catch (error) {
        console.error('Failed to fetch favorites:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  if (loading || dataLoading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const handleRemoveTeam = async (teamId) => {
    try {
      await toggleFavoriteTeam(teamId);
      setFavoriteTeams(prev => prev.filter(t => t.id !== teamId));
    } catch (error) {
      console.error('Failed to remove team:', error);
    }
  };

  const handleRemoveMatch = async (matchId) => {
    try {
      await toggleFavoriteMatch(matchId);
      setFavoriteMatches(prev => prev.filter(m => m.id !== matchId));
    } catch (error) {
      console.error('Failed to remove match:', error);
    }
  };

  const handleDeleteAccount = async () => {
    const result = await deleteAccount();
    if (result.success) {
      navigate('/');
    }
  };

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

  return (
    <div className="container mt-4">
      <div className="mb-4">
        <h1 className="text-gradient-cyber">My Profile</h1>
        <p className="text-muted">Welcome back, {user?.username}!</p>
      </div>

      {/* Favorite Teams */}
      <div className="mb-5">
        <h3 className="mb-3">
          <i className="bi bi-star-fill text-warning me-2"></i>
          Favorite Teams ({favoriteTeams.length})
        </h3>
        {favoriteTeams.length === 0 ? (
          <div className="alert alert-info">
            <p className="mb-0">
              You haven't added any favorite teams yet.
              <Link to="/teams" className="ms-2">Browse teams</Link>
            </p>
          </div>
        ) : (
          <div className="row g-3">
            {favoriteTeams.map(team => (
              <div key={team.id} className="col-md-4 col-lg-3">
                <div className="card h-100 team-card">
                  <div className="card-body text-center">
                    <div className="d-flex justify-content-end mb-2">
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleRemoveTeam(team.id)}
                        title="Remove from favorites"
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                    <Link to={`/teams/${team.id}`} className="text-decoration-none">
                      {team.logo && (
                        <img
                          src={team.logo}
                          alt={team.name}
                          style={{ maxWidth: '80px', maxHeight: '80px', objectFit: 'contain' }}
                          className="mb-3"
                        />
                      )}
                      <h5 className="card-title">{team.name}</h5>
                      <p className="text-muted small">{team.region_display}</p>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Favorite Matches */}
      <div>
        <h3 className="mb-3">
          <i className="bi bi-star-fill text-warning me-2"></i>
          Favorite Matches ({favoriteMatches.length})
        </h3>
        {favoriteMatches.length === 0 ? (
          <div className="alert alert-info">
            <p className="mb-0">
              You haven't added any favorite matches yet.
              <Link to="/matches" className="ms-2">Browse matches</Link>
            </p>
          </div>
        ) : (
          <div className="row g-3">
            {favoriteMatches.map(match => (
              <div key={match.id} className="col-md-6 col-lg-4">
                <div className="card h-100 match-card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <p className="text-muted small mb-0">
                        <i className="bi bi-calendar-event me-1"></i>
                        {formatDate(match.date_time)}
                      </p>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleRemoveMatch(match.id)}
                        title="Remove from favorites"
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                    <h6 className="mb-2 text-center">
                      {match.team1_name}
                      <div className="text-muted small">vs</div>
                      {match.team2_name}
                    </h6>
                    {match.score && (
                      <p className="text-center mb-2">
                        <span className="badge bg-primary">{match.score}</span>
                      </p>
                    )}
                    {match.tournament_name && (
                      <p className="text-muted small mb-0 text-center">
                        <span className="badge bg-secondary">{match.tournament_name}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Account */}
      <div className="mt-5 pt-4 border-top">
        <h3 className="mb-3 text-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Danger Zone
        </h3>
        {!showDeleteConfirm ? (
          <button
            className="btn btn-outline-danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete My Account
          </button>
        ) : (
          <div className="alert alert-danger">
            <p className="fw-bold mb-2">Are you sure you want to delete your account?</p>
            <p className="mb-3">This action is permanent and cannot be undone. All your data, favorites, and notification preferences will be lost.</p>
            <div className="d-flex gap-2">
              <button
                className="btn btn-danger"
                onClick={handleDeleteAccount}
              >
                Yes, Delete My Account
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
