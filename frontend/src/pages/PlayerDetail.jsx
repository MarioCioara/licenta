import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const calculateAge = (birthDate) => {
  if (!birthDate) return '—';
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const PlayerHeader = ({ player }) => (
  <div className="card mb-4">
    <div className="card-body">
      <div className="row align-items-center">
        <div className="col-md-8">
          <h2 className="mb-2">{player.nickname}</h2>
          <p className="text-muted mb-3">{player.real_name}</p>

          <div className="row mt-3">
            <div className="col-md-3">
              <strong>Role:</strong>
              <p className="mb-0">
                <span className="badge bg-primary">{player.role}</span>
              </p>
            </div>
            <div className="col-md-3">
              <strong>Country:</strong>
              <p className="mb-0">{player.country}</p>
            </div>
            <div className="col-md-3">
              <strong>Age:</strong>
              <p className="mb-0">{calculateAge(player.birth_date)} years</p>
            </div>
            <div className="col-md-3">
              <strong>Birth Date:</strong>
              <p className="mb-0">{formatDate(player.birth_date)}</p>
            </div>
          </div>

          {player.social_media && Object.keys(player.social_media).length > 0 && (
            <div className="mt-3">
              <strong>Social Media:</strong>
              <div className="d-flex gap-2 mt-2">
                {player.social_media.twitter && (
                  <a
                    href={player.social_media.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary"
                  >
                    Twitter
                  </a>
                )}
                {player.social_media.twitch && (
                  <a
                    href={player.social_media.twitch}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary"
                  >
                    Twitch
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="col-md-4 text-center">
          <div className="player-role-icon">
            <i className="fas fa-user-circle fa-5x text-primary"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const CurrentTeamSection = ({ player, team }) => (
  <div className="fade-in">
    <h4 className="mb-3">Current Team</h4>
    {team ? (
      <div className="card">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-2 text-center">
              {team.logo ? (
                <img
                  src={team.logo}
                  alt={team.name}
                  style={{
                    maxHeight: '80px',
                    objectFit: 'contain',
                    backgroundColor: (team.name === 'G2 Esports' || team.name === 'Fnatic' || team.name === 'Natus Vincere' || team.name === 'Karmine Corp' || team.name === 'Karmine Corp Blue' || team.name === 'SK Gaming' || team.name === 'Team Heretics' || team.name === 'Shifters' || team.name === 'Los Ratones' || team.name === 'Team Vitality' || team.name === 'KOI' || team.name === 'GIANTX') ? '#000000' : 'transparent',
                    padding: (team.name === 'G2 Esports' || team.name === 'Fnatic' || team.name === 'Natus Vincere' || team.name === 'Karmine Corp' || team.name === 'Karmine Corp Blue' || team.name === 'SK Gaming' || team.name === 'Team Heretics' || team.name === 'Shifters' || team.name === 'Los Ratones' || team.name === 'Team Vitality' || team.name === 'KOI' || team.name === 'GIANTX') ? '10px' : '0'
                  }}
                />
              ) : (
                <div className="text-muted">No Logo</div>
              )}
            </div>
            <div className="col-md-10">
              <h5 className="mb-2">
                <Link to={`/teams/${team.id}`} className="text-decoration-none">
                  {team.name}
                </Link>
              </h5>
              <p className="text-muted mb-1">
                <strong>Region:</strong> {team.region_display || team.region}
              </p>
              <p className="text-muted mb-0">
                <strong>Country:</strong> {team.country}
              </p>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="alert alert-info">
        <p className="mb-0">This player is currently a free agent.</p>
      </div>
    )}
  </div>
);

const PlayerStatsSection = ({ player }) => {
  const stats = player.stats || {};
  const hasStats = Object.keys(stats).length > 0;

  if (!hasStats) {
    return (
      <div className="fade-in">
        <h4 className="mb-3">Player Statistics</h4>
        <div className="alert alert-info">
          <p className="mb-0">No statistics available for this player yet.</p>
        </div>
      </div>
    );
  }

  const generalStats = ['Games', 'Win Rate', 'KDA', 'AVG Kills', 'AVG Deaths', 'AVG Assists'];
  const farmingStats = ['CSM', 'GPM', 'CSG@15', 'GD@15', 'XPD@15'];
  const combatStats = ['KP%', 'DMG%', 'DPM', 'FB%', 'FB Victim', 'Penta Kills', 'Solo Kills'];
  const visionStats = ['VS%', 'VSPM', 'AVG WPM', 'AVG WCPM', 'AVG VWPM'];
  const economyStats = ['GOLD%'];

  const renderStatRow = (label, value) => {
    if (value === null || value === undefined) return null;

    let displayValue = value;
    if (typeof value === 'number') {
      if (label.includes('%')) {
        displayValue = `${(value * 100).toFixed(1)}%`;
      } else {
        displayValue = value.toFixed(2);
      }
    }

    return (
      <tr key={label}>
        <td className="fw-bold">{label}</td>
        <td className="text-end">{displayValue}</td>
      </tr>
    );
  };

  const renderStatGroup = (title, statKeys) => {
    const relevantStats = statKeys.filter(key => stats[key] !== null && stats[key] !== undefined);
    if (relevantStats.length === 0) return null;

    return (
      <div className="col-md-6 mb-4">
        <h6 className="text-muted mb-3">{title}</h6>
        <div className="table-responsive">
          <table className="table table-sm table-hover">
            <tbody>
              {relevantStats.map(key => renderStatRow(key, stats[key]))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <h4 className="mb-3">Player Statistics</h4>
      <div className="card">
        <div className="card-body">
          <div className="row">
            {renderStatGroup('General Stats', generalStats)}
            {renderStatGroup('Combat Stats', combatStats)}
            {renderStatGroup('Farming Stats', farmingStats)}
            {renderStatGroup('Vision Stats', visionStats)}
            {renderStatGroup('Economy Stats', economyStats)}
          </div>
        </div>
      </div>
    </div>
  );
};

const CareerOverviewSection = ({ player, team }) => (
  <div className="fade-in">
    <h4 className="mb-3">Career Overview</h4>
    <div className="card">
      <div className="card-body">
        <h6 className="text-muted mb-3">Team History</h6>
        {team ? (
          <div className="mb-3">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <span className="badge bg-success">Current</span>
              </div>
              <div>
                <strong>{team.name}</strong>
                <p className="text-muted mb-0 small">Playing as {player.role}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted">No team history available.</p>
        )}

        <hr />

        <h6 className="text-muted mb-3">Professional Information</h6>
        <div className="row">
          <div className="col-md-6">
            <p className="mb-2">
              <strong>In-game Name:</strong> {player.nickname}
            </p>
            <p className="mb-2">
              <strong>Real Name:</strong> {player.real_name}
            </p>
          </div>
          <div className="col-md-6">
            <p className="mb-2">
              <strong>Nationality:</strong> {player.country}
            </p>
            <p className="mb-2">
              <strong>Primary Role:</strong> <span className="badge bg-primary">{player.role}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const PlayerDetail = () => {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('current-team');

  useEffect(() => {
    const fetchPlayerData = async () => {
      setLoading(true);
      setError(null);
      try {
        const playerRes = await axios.get(`http://localhost:8000/api/players/${id}/`);
        setPlayer(playerRes.data);

        if (playerRes.data.team) {
          const teamRes = await axios.get(`http://localhost:8000/api/teams/${playerRes.data.team}/`);
          setTeam(teamRes.data);
        }
      } catch (err) {
        console.error('Error fetching player data:', err);
        setError('Could not load player details.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [id]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="loading-text">Loading player...</p>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="fade-in">
        <div className="alert alert-warning">{error || 'Player not found'}</div>
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
          {team && (
            <li className="breadcrumb-item">
              <Link to={`/teams/${team.id}`}>{team.name}</Link>
            </li>
          )}
          <li className="breadcrumb-item active" aria-current="page">
            {player.nickname}
          </li>
        </ol>
      </nav>

      {/* Player Header */}
      <PlayerHeader player={player} />

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4" role="tablist">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'current-team' ? 'active' : ''}`}
            onClick={() => setActiveTab('current-team')}
          >
            Current Team
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'career' ? 'active' : ''}`}
            onClick={() => setActiveTab('career')}
          >
            Career Overview
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'current-team' && <CurrentTeamSection player={player} team={team} />}
        {activeTab === 'stats' && <PlayerStatsSection player={player} />}
        {activeTab === 'career' && <CareerOverviewSection player={player} team={team} />}
      </div>
    </div>
  );
};

export default PlayerDetail;
