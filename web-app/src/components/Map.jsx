import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapComponent = ({ signalements, onSignalementSelect, onPhotoClick, className = '' }) => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markersLayerRef = useRef(null);

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current) return;

    // Create map
    const mapObj = L.map(mapContainer.current).setView([-18.8792, 47.5079], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapObj);

    const markersGroup = L.featureGroup().addTo(mapObj);

    mapInstance.current = mapObj;
    markersLayerRef.current = markersGroup;

    return () => {
      mapObj.remove();
      mapInstance.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Update markers when signalements change
  useEffect(() => {
    const mapObj = mapInstance.current;
    const markersGroup = markersLayerRef.current;

    if (!mapObj || !markersGroup) return;

    // Clear existing markers
    markersGroup.clearLayers();

    if (!signalements || signalements.length === 0) return;

    signalements.forEach((signalement) => {
      if (
        signalement.latitude === null || signalement.longitude === null ||
        isNaN(signalement.latitude) || isNaN(signalement.longitude)
      ) {
        return;
      }

      const colorMap = {
        'nouveau': '#dc3545',
        'en_cours': '#ffc107',
        'termine': '#28a745',
      };

      const color = colorMap[signalement.status] || '#dc3545';

      // Collect all photos
      const allPhotos = [];
      if (signalement.photo) allPhotos.push(signalement.photo);
      if (signalement.photos && signalement.photos.length > 0) {
        signalement.photos.forEach(p => {
          if (p && !allPhotos.includes(p)) allPhotos.push(p);
        });
      }

      let photosHtml = '';
      if (allPhotos.length > 0) {
        photosHtml = `
          <hr style="margin: 8px 0; border-color: #eee;">
          <p style="margin: 5px 0;"><strong>📷 Photos (${allPhotos.length}):</strong></p>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
            ${allPhotos.map((url, i) =>
              `<img src="${url}" alt="Photo ${i + 1}" class="popup-photo-thumb" data-photo-url="${url}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 2px solid #dee2e6; cursor: pointer;" onerror="this.style.display='none'" />`
            ).join('')}
          </div>`;
      } else {
        photosHtml = `
          <hr style="margin: 8px 0; border-color: #eee;">
          <p style="margin: 5px 0; color: #999;"><strong>📷 Photos:</strong> Aucune photo</p>`;
      }

      const marker = L.circleMarker(
        [signalement.latitude, signalement.longitude],
        {
          radius: 14,
          fillColor: color,
          color: '#fff',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.9,
        }
      )
        .bindPopup(
          `<div style="min-width: 240px; max-width: 320px; font-size: 13px;">
            <h5 style="margin: 0 0 10px 0; font-weight: bold;">Signalement #${signalement.id}</h5>
            <p style="margin: 5px 0;"><strong>Entreprise:</strong> ${signalement.company || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${signalement.status === 'nouveau' ? '🔴 Nouveau' : signalement.status === 'en_cours' ? '🟠 En cours' : '🟢 Terminé'}</p>
            <p style="margin: 5px 0;"><strong>Surface:</strong> ${(signalement.surface || 0).toFixed(2)} m²</p>
            <p style="margin: 5px 0;"><strong>Niveau:</strong> ${signalement.niveau || 1} / 10</p>
            <p style="margin: 5px 0;"><strong>Budget:</strong> ${(signalement.budget || 0).toLocaleString()} Ar</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(signalement.createdDate).toLocaleDateString('fr-FR')}</p>
            ${photosHtml}
          </div>`,
          { maxWidth: 350 }
        )
        .on('click', () => {
          if (onSignalementSelect) {
            onSignalementSelect(signalement);
          }
        });

      // Handle photo click inside popup
      marker.on('popupopen', () => {
        setTimeout(() => {
          const thumbs = document.querySelectorAll('.popup-photo-thumb');
          thumbs.forEach(thumb => {
            thumb.addEventListener('click', (e) => {
              e.stopPropagation();
              const url = e.target.getAttribute('data-photo-url');
              if (url && onPhotoClick) onPhotoClick(url);
            });
          });
        }, 100);
      });

      markersGroup.addLayer(marker);
    });
  }, [signalements, onSignalementSelect]);

  return (
    <div
      ref={mapContainer}
      className={`w-100 h-100 rounded-3 ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
};

export default MapComponent;
