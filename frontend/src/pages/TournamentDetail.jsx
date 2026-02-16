import React, { useEffect, useState } from 'react';
import api from '../config/api';
import { useParams, Link } from 'react-router-dom';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatDateTime = (dateStr) => {
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

const formatPrize = (value) => {
  if (value == null) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num}`;
};

const statusBadgeClass = (status) => {
  switch (status) {
    case 'completed': return 'bg-secondary';
    case 'ongoing': return 'bg-success';
    case 'upcoming': return 'bg-info';
    default: return 'bg-secondary';
  }
};

const hasPlayoffMatches = (matches) => {
  return matches.some(m =>
    m.stats?.block_name &&
    (m.stats.block_name.toLowerCase().includes('playoff') ||
     m.stats.block_name.toLowerCase().includes('semifinal') ||
     m.stats.block_name.toLowerCase().includes('final'))
  );
};

const TournamentHeader = ({ tournament }) => (
  <div className="card mb-4 tournament-header-card">
    <div className="card-body">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h2 className="mb-2">{tournament.name}</h2>
          <p className="text-muted mb-0">{tournament.game_name}</p>
        </div>
        <span className={`badge ${statusBadgeClass(tournament.status)}`}>
          {tournament.status}
        </span>
      </div>
      <div className="row">
        <div className="col-md-3">
          <strong>Dates:</strong>
          <p>{formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}</p>
        </div>
        <div className="col-md-3">
          <strong>Location:</strong>
          <p>{tournament.location || '—'}</p>
        </div>
        <div className="col-md-3">
          <strong>Prize Pool:</strong>
          <p>{formatPrize(tournament.prize_pool)}</p>
        </div>
        <div className="col-md-3">
          <strong>Format:</strong>
          <p>{tournament.format || '—'}</p>
        </div>
      </div>
    </div>
  </div>
);

const OverviewTab = ({ tournament }) => (
  <div className="fade-in">
    <h4 className="mb-3">Participating Teams</h4>
    {tournament.participants && tournament.participants.length > 0 ? (
      <div className="row row-cols-2 row-cols-md-4 row-cols-lg-5 g-3">
        {tournament.participants.map((team) => (
          <div key={team.id} className="col">
            <div className="card h-100 text-center team-card-small">
              <div className="card-body p-2">
                <h6 className="card-title mb-0 small">{team.name}</h6>
                {team.country && (
                  <p className="text-muted small mb-0">{team.country}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-muted">No participating teams yet.</p>
    )}
  </div>
);

const MatchCard = ({ match }) => (
  <div className="card">
    <div className="card-body">
      <div className="row align-items-center">
        <div className="col-md-3">
          <p className="text-muted small mb-1">{formatDateTime(match.date_time)}</p>
          {match.stats?.block_name && (
            <p className="text-muted small mb-0">{match.stats.block_name}</p>
          )}
        </div>
        <div className="col-md-6 text-center">
          <h5 className="mb-1">
            <span className={match.result?.includes(match.team1_name) ? 'text-success fw-bold' : ''}>
              {match.team1_name}
            </span>
            {' vs '}
            <span className={match.result?.includes(match.team2_name) ? 'text-success fw-bold' : ''}>
              {match.team2_name}
            </span>
          </h5>
          <p className="mb-0">
            <span className="badge bg-secondary">{match.score}</span>
          </p>
        </div>
        <div className="col-md-3 text-md-end">
          <p className="text-muted small mb-1">{match.result}</p>
          {match.vod_link && match.vod_link !== 'https://lolesports.com' && (
            <a
              href={match.vod_link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-primary"
            >
              Watch VOD
            </a>
          )}
        </div>
      </div>
    </div>
  </div>
);

const MatchesTab = ({ matches }) => {
  const now = new Date();
  const upcomingMatches = matches.filter(m => new Date(m.date_time) > now);
  const pastMatches = matches.filter(m => new Date(m.date_time) <= now);

  return (
    <div className="fade-in">
      {/* Upcoming Matches */}
      <h4 className="mb-3">Upcoming Matches</h4>
      {upcomingMatches.length > 0 ? (
        <div className="row g-3 mb-5">
          {upcomingMatches.map(match => (
            <div key={match.id} className="col-12">
              <MatchCard match={match} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted mb-5">No upcoming matches.</p>
      )}

      {/* Past Matches */}
      <h4 className="mb-3">Past Matches</h4>
      {pastMatches.length > 0 ? (
        <div className="row g-3">
          {pastMatches.reverse().map(match => (
            <div key={match.id} className="col-12">
              <MatchCard match={match} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted">No past matches yet.</p>
      )}
    </div>
  );
};

const StandingsTab = ({ standings }) => {
  const hasGroups = standings.length > 0 && standings[0].group;

  if (hasGroups) {
    // Group standings by group name
    const groupedStandings = standings.reduce((acc, standing) => {
      if (!acc[standing.group]) {
        acc[standing.group] = [];
      }
      acc[standing.group].push(standing);
      return acc;
    }, {});

    return (
      <div className="fade-in">
        <h4 className="mb-4">Current Standings</h4>
        {Object.entries(groupedStandings).map(([groupName, groupStandings]) => (
          <div key={groupName} className="mb-4">
            <h5 className="mb-3">{groupName}</h5>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Team</th>
                    <th>Wins</th>
                    <th>Losses</th>
                    <th>Games Won</th>
                    <th>Games Lost</th>
                    <th>Game Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {groupStandings.map((standing) => (
                    <tr key={standing.team_id}>
                      <td className="fw-bold">{standing.rank}</td>
                      <td>
                        <span className="fw-bold">{standing.team_name}</span>
                      </td>
                      <td className="text-success fw-bold">{standing.wins}</td>
                      <td className="text-danger">{standing.losses}</td>
                      <td>{standing.games_won}</td>
                      <td>{standing.games_lost}</td>
                      <td className={standing.game_differential >= 0 ? 'text-success' : 'text-danger'}>
                        {standing.game_differential >= 0 ? '+' : ''}{standing.game_differential}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h4 className="mb-3">Current Standings</h4>
      {standings.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>#</th>
                <th>Team</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Games Won</th>
                <th>Games Lost</th>
                <th>Game Diff</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((standing, index) => (
                <tr key={standing.team_id}>
                  <td className="fw-bold">{index + 1}</td>
                  <td>
                    <span className="fw-bold">{standing.team_name}</span>
                  </td>
                  <td className="text-success fw-bold">{standing.wins}</td>
                  <td className="text-danger">{standing.losses}</td>
                  <td>{standing.games_won}</td>
                  <td>{standing.games_lost}</td>
                  <td className={standing.game_differential >= 0 ? 'text-success' : 'text-danger'}>
                    {standing.game_differential >= 0 ? '+' : ''}{standing.game_differential}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted">No standings data available.</p>
      )}
    </div>
  );
};

const BracketTab = ({ matches }) => {
  const playoffMatches = matches.filter(m =>
    m.stats?.block_name &&
    (m.stats.block_name.toLowerCase().includes('playoff') ||
     m.stats.block_name.toLowerCase().includes('semifinal') ||
     m.stats.block_name.toLowerCase().includes('final'))
  );

  const groupedByRound = playoffMatches.reduce((acc, match) => {
    const round = match.stats.block_name;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {});

  return (
    <div className="fade-in">
      <h4 className="mb-3">Playoff Bracket</h4>
      {Object.keys(groupedByRound).length > 0 ? (
        <div className="bracket-container">
          {Object.entries(groupedByRound).map(([round, roundMatches]) => (
            <div key={round} className="bracket-round mb-4">
              <h5 className="text-center mb-3">{round}</h5>
              <div className="row g-3">
                {roundMatches.map(match => (
                  <div key={match.id} className="col-12 col-md-6">
                    <div className="card bracket-match">
                      <div className="card-body">
                        <div className={`bracket-team ${match.result?.includes(match.team1_name) ? 'winner' : ''}`}>
                          <span className="fw-bold">{match.team1_name}</span>
                          <span className="float-end">{match.score.split('-')[0]}</span>
                        </div>
                        <hr className="my-2" />
                        <div className={`bracket-team ${match.result?.includes(match.team2_name) ? 'winner' : ''}`}>
                          <span className="fw-bold">{match.team2_name}</span>
                          <span className="float-end">{match.score.split('-')[1]}</span>
                        </div>
                        <p className="text-muted small mb-0 mt-2">{formatDate(match.date_time)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted">No playoff matches yet.</p>
      )}
    </div>
  );
};

const TournamentDetail = () => {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchTournamentData = async () => {
      setLoading(true);
      setError(null);
      try {
        const tournamentRes = await api.get(`/api/tournaments/${id}/`);
        setTournament(tournamentRes.data);

        const matchesRes = await api.get(`/api/matches/?tournament=${id}`);
        setMatches(matchesRes.data);

        const standingsRes = await api.get(`/api/tournaments/${id}/standings/`);
        setStandings(standingsRes.data);
      } catch (err) {
        console.error('Error fetching tournament data:', err);
        setError('Could not load tournament details.');
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentData();
  }, [id]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="loading-text">Loading tournament...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="fade-in">
        <div className="alert alert-warning">{error || 'Tournament not found'}</div>
        <Link to="/tournaments" className="btn btn-primary">Back to Tournaments</Link>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/tournaments">Tournaments</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {tournament.name}
          </li>
        </ol>
      </nav>

      {/* Tournament Header */}
      <TournamentHeader tournament={tournament} />

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
            className={`nav-link ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            Matches
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'standings' ? 'active' : ''}`}
            onClick={() => setActiveTab('standings')}
          >
            Standings
          </button>
        </li>
        {hasPlayoffMatches(matches) && (
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'bracket' ? 'active' : ''}`}
              onClick={() => setActiveTab('bracket')}
            >
              Bracket
            </button>
          </li>
        )}
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && <OverviewTab tournament={tournament} />}
        {activeTab === 'matches' && <MatchesTab matches={matches} />}
        {activeTab === 'standings' && <StandingsTab standings={standings} />}
        {activeTab === 'bracket' && <BracketTab matches={matches} />}
      </div>
    </div>
  );
};

export default TournamentDetail;
