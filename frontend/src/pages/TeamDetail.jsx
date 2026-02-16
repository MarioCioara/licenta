import React, { useEffect, useState, useContext } from 'react';
import api from '../config/api';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const TeamHeader = ({ team, isFavorite, onToggleFavorite, isAuthenticated }) => (
  <div className="card mb-4 team-header-card">
    <div className="card-body">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <h2 className="mb-0">{team.name}</h2>
        <button
          className={`btn ${isFavorite ? 'btn-warning' : 'btn-outline-warning'}`}
          onClick={onToggleFavorite}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <i className={`bi bi-star${isFavorite ? '-fill' : ''} me-2`}></i>
          {isFavorite ? 'Favorited' : 'Add to Favorites'}
        </button>
      </div>
      <div className="row align-items-center">
        <div className="col-md-8">
          <div className="row mt-3">
            <div className="col-md-4">
              <strong>Country:</strong>
              <p>{team.country}</p>
            </div>
            <div className="col-md-4">
              <strong>Region:</strong>
              <p>{team.region_display || team.region}</p>
            </div>
            <div className="col-md-4">
              <strong>Founded:</strong>
              <p>{formatDate(team.founded_date)}</p>
            </div>
          </div>
          {team.social_media && Object.keys(team.social_media).length > 0 && (
            <div className="mt-3">
              <strong>Social Media:</strong>
              <div className="d-flex gap-2 mt-2">
                {team.social_media.twitter && (
                  <a
                    href={team.social_media.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary"
                  >
                    Twitter
                  </a>
                )}
                {team.social_media.website && (
                  <a
                    href={team.social_media.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary"
                  >
                    Website
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="col-md-4 text-center">
          {team.logo ? (
            <img
              src={team.logo}
              alt={team.name}
              className="img-fluid"
              style={{
                maxHeight: '150px',
                objectFit: 'contain',
                backgroundColor: (
                  team.name === 'Dplus KIA' ||
                  team.name === 'Oh My God' ||
                  team.name === 'Deep Cross Gaming' ||
                  team.name === 'Fukuoka SoftBank HAWKS gaming' ||
                  team.name === 'Secret Whales'
                ) ? '#FFFFFF' : (
                  team.name === 'G2 Esports' ||
                  team.name === 'Fnatic' ||
                  team.name === 'Natus Vincere' ||
                  team.name === 'Karmine Corp' ||
                  team.name === 'Karmine Corp Blue' ||
                  team.name === 'SK Gaming' ||
                  team.name === 'Team Heretics' ||
                  team.name === 'Shifters' ||
                  team.name === 'Los Ratones' ||
                  team.name === 'Team Vitality' ||
                  team.name === 'KOI' ||
                  team.name === 'GIANTX'
                ) ? '#000000' : 'transparent',
                padding: (
                  team.name === 'Dplus KIA' ||
                  team.name === 'Oh My God' ||
                  team.name === 'Deep Cross Gaming' ||
                  team.name === 'Fukuoka SoftBank HAWKS gaming' ||
                  team.name === 'Secret Whales' ||
                  team.name === 'G2 Esports' ||
                  team.name === 'Fnatic' ||
                  team.name === 'Natus Vincere' ||
                  team.name === 'Karmine Corp' ||
                  team.name === 'Karmine Corp Blue' ||
                  team.name === 'SK Gaming' ||
                  team.name === 'Team Heretics' ||
                  team.name === 'Shifters' ||
                  team.name === 'Los Ratones' ||
                  team.name === 'Team Vitality' ||
                  team.name === 'KOI' ||
                  team.name === 'GIANTX'
                ) ? '20px' : '0'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="text-muted">Logo unavailable</div>';
              }}
            />
          ) : (
            <div className="text-muted">No Logo</div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const OverviewTab = ({ team }) => (
  <div className="fade-in">
    <h4 className="mb-3">About {team.name}</h4>
    {team.description ? (
      <div className="card">
        <div className="card-body">
          <div className="card-text" style={{ whiteSpace: 'pre-wrap' }}>
            {team.description}
          </div>
        </div>
      </div>
    ) : (
      <p className="text-muted">No description available.</p>
    )}
  </div>
);

const CurrentRosterTab = ({ players }) => (
  <div className="fade-in">
    <h4 className="mb-3">Current Roster</h4>
    {players && players.length > 0 ? (
      <div className="row g-3">
        {players.map((player) => (
          <div key={player.id} className="col-md-6 col-lg-4">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">
                  <Link to={`/players/${player.id}`} className="text-decoration-none">
                    {player.nickname}
                  </Link>
                </h5>
                <p className="card-text text-muted mb-2">
                  <strong>Role:</strong> {player.role}
                </p>
                <p className="card-text text-muted mb-2">
                  <strong>Real Name:</strong> {player.real_name}
                </p>
                <p className="card-text text-muted mb-2">
                  <strong>Country:</strong> {player.country}
                </p>
                <p className="card-text text-muted mb-0">
                  <strong>Birth Date:</strong> {formatDate(player.birth_date)}
                </p>
                {player.social_media && Object.keys(player.social_media).length > 0 && (
                  <div className="mt-3">
                    {player.social_media.twitter && (
                      <a
                        href={player.social_media.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary me-2"
                      >
                        Twitter
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="alert alert-info">
        <p className="mb-0">No players currently registered for this team.</p>
      </div>
    )}
  </div>
);

const TournamentResultsTab = ({ tournamentResults }) => (
  <div className="fade-in">
    <h4 className="mb-3">Tournament Results</h4>
    {tournamentResults && tournamentResults.length > 0 ? (
      <div className="table-responsive">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>Tournament</th>
              <th>Status</th>
              <th className="text-center">Matches</th>
              <th className="text-center">Wins</th>
              <th className="text-center">Losses</th>
              <th className="text-center">Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {tournamentResults.map((result) => {
              const winRate = result.total_matches > 0
                ? ((result.wins / result.total_matches) * 100).toFixed(1)
                : '0.0';

              return (
                <tr key={result.tournament_id}>
                  <td>
                    <Link to={`/tournaments/${result.tournament_id}`} className="text-decoration-none">
                      <strong>{result.tournament_name}</strong>
                    </Link>
                    <br />
                    <small className="text-muted">
                      {formatDate(result.start_date)}
                    </small>
                  </td>
                  <td>
                    <span className={`badge ${
                      result.tournament_status === 'completed' ? 'bg-secondary' :
                      result.tournament_status === 'ongoing' ? 'bg-success' :
                      'bg-info'
                    }`}>
                      {result.tournament_status}
                    </span>
                  </td>
                  <td className="text-center">{result.total_matches}</td>
                  <td className="text-center text-success fw-bold">{result.wins}</td>
                  <td className="text-center text-danger">{result.losses}</td>
                  <td className="text-center">
                    <span className={`fw-bold ${
                      parseFloat(winRate) >= 60 ? 'text-success' :
                      parseFloat(winRate) >= 40 ? 'text-warning' :
                      'text-danger'
                    }`}>
                      {winRate}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="alert alert-info">
        <p className="mb-0">No tournament results available yet.</p>
      </div>
    )}
  </div>
);

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, toggleFavoriteTeam } = useContext(AuthContext);
  const [team, setTeam] = useState(null);
  const [tournamentResults, setTournamentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchTeamData = async () => {
      setLoading(true);
      setError(null);
      try {
        const teamRes = await api.get(`/api/teams/${id}/`);
        setTeam(teamRes.data);

        const resultsRes = await api.get(`/api/teams/${id}/tournament_results/`);
        setTournamentResults(resultsRes.data);
      } catch (err) {
        console.error('Error fetching team data:', err);
        setError('Could not load team details.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [id]);

  useEffect(() => {
    if (team && user) {
      setIsFavorite(user.favorite_teams?.includes(team.id));
    }
  }, [team, user]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const result = await toggleFavoriteTeam(team.id);
      setIsFavorite(result.is_favorite);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="loading-text">Loading team...</p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="fade-in">
        <div className="alert alert-warning">{error || 'Team not found'}</div>
        <Link to="/teams" className="btn btn-primary">Back to Teams</Link>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/teams">Teams</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {team.name}
          </li>
        </ol>
      </nav>

      {/* Team Header */}
      <TeamHeader
        team={team}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
        isAuthenticated={isAuthenticated}
      />

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4" role="tablist">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'roster' ? 'active' : ''}`}
            onClick={() => setActiveTab('roster')}
          >
            Current Roster
            {team.current_players && team.current_players.length > 0 && (
              <span className="badge bg-primary ms-2">{team.current_players.length}</span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            Tournament Results
            {tournamentResults.length > 0 && (
              <span className="badge bg-primary ms-2">{tournamentResults.length}</span>
            )}
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && <OverviewTab team={team} />}
        {activeTab === 'roster' && <CurrentRosterTab players={team.current_players} />}
        {activeTab === 'results' && <TournamentResultsTab tournamentResults={tournamentResults} />}
      </div>
    </div>
  );
};

export default TeamDetail;
