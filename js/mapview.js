// Case map (Leaflet + OpenStreetMap): IP locations, photo/video GPS and places added by hand.
'use strict';

const MapView = (() => {
    let map = null, layer = null;

    function ensure() {
        if (map || !window.L) return !!map;
        map = L.map('map', { worldCopyJump: true }).setView([20, 0], 2);
        // OSM's tile policy needs a referrer, which the page otherwise strips.
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, referrerPolicy: 'strict-origin-when-cross-origin', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
        layer = L.layerGroup().addTo(map);
        map.on('click', e => {
            const label = prompt('Label for this place (e.g. “Hotel in photo E4”):');
            if (!label) return;
            CaseFile.addPlace({ lat: +e.latlng.lat.toFixed(6), lon: +e.latlng.lng.toFixed(6), label, source: 'added by analyst' });
            render();
        });
        return true;
    }

    function render() {
        if (!ensure()) { $('#map').innerHTML = '<p class="muted small" style="padding:1rem">Map library is still loading…</p>'; return; }
        setTimeout(() => map.invalidateSize(), 50);
        layer.clearLayers();
        const places = CaseFile.data.places;
        places.forEach((p, i) => {
            const m = L.circleMarker([p.lat, p.lon], { radius: 7, color: p.source?.includes('IP') ? '#ef4444' : '#10b981', weight: 2, fillOpacity: 0.5 }).addTo(layer);
            m.bindPopup(`<b>${esc(p.label)}</b><br><span class="small">${esc(p.source || '')}</span><br><span class="mono small">${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}</span><br>
                <a target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${p.lat},${p.lon}">Street View</a> ·
                <a target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/@${p.lat},${p.lon},400m/data=!3m1!1e3">Satellite</a> ·
                <a target="_blank" rel="noopener noreferrer" href="https://browser.dataspace.copernicus.eu/?zoom=15&lat=${p.lat}&lng=${p.lon}">Copernicus</a> ·
                <a target="_blank" rel="noopener noreferrer" href="https://livingatlas.arcgis.com/wayback/#mapCenter=${p.lon},${p.lat},17">Historic imagery</a>
                ${p.selector ? `<br><button class="linklike" data-investigate="${esc(p.selector)}">${esc(p.selector)}</button>` : ''}`);
        });
        $('#map-list').innerHTML = places.length ? `${places.length} place(s). ${places.filter(p => p.source?.includes('IP')).length ? 'Red = IP location (city-level, approximate).' : ''}` : 'No locations yet. IP lookups and photos with GPS add them automatically, or click the map.';
        if (places.length && !render.fitted) { fit(); render.fitted = true; }
    }

    function fit() {
        const pts = CaseFile.data.places.map(p => [p.lat, p.lon]);
        if (!map || !pts.length) return;
        if (pts.length === 1) map.setView(pts[0], 12); else map.fitBounds(pts, { padding: [30, 30], maxZoom: 14 });
    }

    function setup() {
        $('#map-fit').onclick = fit;
        document.addEventListener('azimuth:case-switched', () => { render.fitted = false; });
    }

    return { setup, render };
})();
