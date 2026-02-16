import React, { useEffect, useState } from 'react';
import api from '../config/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRegion } from '../context/RegionContext';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
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

const sortTournaments = (tournamentsArray, option) => {
  const sorted = [...tournamentsArray];

  switch (option) {
    case 'game-asc':
      return sorted.sort((a, b) => {
        const gameCompare = (a.game_name || '').localeCompare(b.game_name || '');
        if (gameCompare !== 0) return gameCompare;
        return new Date(b.start_date) - new Date(a.start_date);
      });

    case 'game-desc':
      return sorted.sort((a, b) => {
        const gameCompare = (b.game_name || '').localeCompare(a.game_name || '');
        if (gameCompare !== 0) return gameCompare;
        return new Date(b.start_date) - new Date(a.start_date);
      });

    case 'year-asc':
      return sorted.sort((a, b) => {
        const yearCompare = new Date(a.start_date) - new Date(b.start_date);
        if (yearCompare !== 0) return yearCompare;
        return (a.game_name || '').localeCompare(b.game_name || '');
      });

    case 'year-desc':
    default:
      return sorted.sort((a, b) => {
        const yearCompare = new Date(b.start_date) - new Date(a.start_date);
        if (yearCompare !== 0) return yearCompare;
        return (a.game_name || '').localeCompare(b.game_name || '');
      });
  }
};

const Tournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('year-desc');
  const { regions } = useRegion();
  const navigate = useNavigate();
  const location = useLocation();

  const regionFilter = location.state?.regionFilter;

  const currentRegion = regions.find(r => r.id === regionFilter) || { id: 'all', name: 'All Regions', code: '' };

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = '/api/tournaments/';
        if (currentRegion.code) {
          url += `?region=${currentRegion.code}`;
        }
        const response = await api.get(url);
        setTournaments(response.data);
      } catch (err) {
        console.error('Error fetching tournaments:', err);
        setError('Could not load tournaments.');
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, [currentRegion.code]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="loading-text">Loading tournaments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="mb-4">Tournaments</h2>
        <div className="alert alert-warning">{error}</div>
      </div>
    );
  }

  const sortedTournaments = sortTournaments(tournaments, sortOption);

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Tournaments</h2>
        <p className="text-muted mb-0">
          {currentRegion.id === 'all'
            ? 'Major League of Legends tournaments from around the world'
            : `Major League of Legends tournaments in ${currentRegion.name}`}
        </p>
      </div>
      {tournaments.length > 0 && (
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
          <p className="text-muted mb-0">
            Showing {tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''}
          </p>
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
              aria-label="Sort tournaments"
            >
              <option value="year-desc">Year (Newest First)</option>
              <option value="year-asc">Year (Oldest First)</option>
              <option value="game-asc">Game (A-Z)</option>
              <option value="game-desc">Game (Z-A)</option>
            </select>
          </div>
        </div>
      )}
      {tournaments.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No tournaments found</p>
          <p className="empty-state-message">
            {currentRegion.id === 'all'
              ? 'There are no tournaments in the database yet.'
              : `No tournaments found for ${currentRegion.name}.`}
          </p>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-lg-2 g-4">
          {sortedTournaments.map((t) => (
            <div key={t.id} className="col">
              <div
                className="card h-100 tournament-card"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/tournaments/${t.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate(`/tournaments/${t.id}`);
                  }
                }}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0">{t.name}</h5>
                    <span className={`badge ${statusBadgeClass(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="card-text text-muted small mb-2">{t.game_name}</p>
                  <ul className="list-unstyled small mb-0">
                    <li><strong>Dates:</strong> {formatDate(t.start_date)} – {formatDate(t.end_date)}</li>
                    <li><strong>Location:</strong> {t.location || '—'}</li>
                    <li><strong>Prize pool:</strong> {formatPrize(t.prize_pool)}</li>
                    <li><strong>Format:</strong> {t.format || '—'}</li>
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tournaments;
