import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegion } from '../context/RegionContext';

const Regions = () => {
  const navigate = useNavigate();
  const { regions } = useRegion();

  const regionIcons = {
    all: '🌍',
    europe: '🇪🇺',
    north_america: '🇺🇸',
    china: '🇨🇳',
    south_korea: '🇰🇷',
    apac: '🌏',
  };

  const handleRegionClick = (regionId) => {
    navigate('/tournaments', { state: { regionFilter: regionId } });
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Regions</h2>
        <p className="text-muted">
          Select a region to view tournaments
        </p>
      </div>
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 stagger-animate">
        {regions.map((region) => (
          <div key={region.id} className="col">
            <div
              className="card h-100 scale-in hover-card"
              onClick={() => handleRegionClick(region.id)}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleRegionClick(region.id);
              }}
            >
              <div className="card-body text-center">
                <div
                  className="region-icon mb-3"
                  style={{ fontSize: '4rem' }}
                  aria-hidden="true"
                >
                  {regionIcons[region.id]}
                </div>
                <h3 className="card-title mb-2">{region.name}</h3>
                <p className="text-muted small mb-0">
                  View tournaments →
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Regions;
