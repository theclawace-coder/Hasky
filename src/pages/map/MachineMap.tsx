import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/mapbox';
import { MapPin } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { MAPBOX_ACCESS_TOKEN } from '../../lib/mapbox';
import { formatDate } from '../../lib/utils';
import { getMachineLocationsByDate, type MachineLocationPoint } from '../../services/api';

const todayString = new Date().toISOString().split('T')[0];

const markerColor = (point: MachineLocationPoint) => {
  if (point.source === 'job') return '#7c3aed';
  if (point.machine_status === 'available') return '#10b981';
  if (point.machine_status === 'under_repair') return '#ef4444';
  return '#2563eb';
};

export default function MachineMap() {
  const [dateOn, setDateOn] = useState(todayString);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const locationsQuery = useQuery({
    queryKey: ['machine_locations', dateOn],
    queryFn: () => getMachineLocationsByDate(dateOn),
  });

  const filteredPoints = useMemo(() => {
    return (locationsQuery.data ?? []).filter((point) =>
      statusFilter ? point.machine_status === statusFilter : true,
    );
  }, [locationsQuery.data, statusFilter]);

  const mapPoints = useMemo(
    () => filteredPoints.filter((point) => point.latitude != null && point.longitude != null),
    [filteredPoints],
  );

  const selectedPoint = useMemo(
    () => filteredPoints.find((point) => point.machine_id === selectedId) ?? null,
    [filteredPoints, selectedId],
  );

  const initialViewState = useMemo(() => {
    const first = mapPoints[0];
    if (first?.latitude != null && first?.longitude != null) {
      return { latitude: first.latitude, longitude: first.longitude, zoom: 9 };
    }
    return { latitude: -33.8688, longitude: 151.2093, zoom: 4 };
  }, [mapPoints]);

  const mapReady = MAPBOX_ACCESS_TOKEN.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Machine Map</h2>
      </div>

      <Card className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
            <input
              type="date"
              value={dateOn}
              onChange={(event) => setDateOn(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Machine status</label>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All</option>
              <option value="available">Available</option>
              <option value="on_hire">On hire</option>
              <option value="under_repair">Under repair</option>
              <option value="in_transit">In transit</option>
              <option value="decommissioned">Decommissioned</option>
            </Select>
          </div>
          <div className="flex items-end">
            <p className="text-sm text-slate-500">
              {mapPoints.length} machine{mapPoints.length !== 1 ? 's' : ''} with map coordinates
            </p>
          </div>
        </div>
      </Card>

      {!mapReady ? (
        <Card>
          <p className="text-sm text-amber-700">
            Map disabled: set `VITE_MAPBOX_ACCESS_TOKEN` to render the map.
          </p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <Map
            mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            initialViewState={initialViewState}
            style={{ width: '100%', height: 520 }}
          >
            <NavigationControl position="top-right" />
            {mapPoints.map((point) => (
              <Marker
                key={point.machine_id}
                latitude={point.latitude as number}
                longitude={point.longitude as number}
                anchor="bottom"
                onClick={(event) => {
                  event.originalEvent.stopPropagation();
                  setSelectedId(point.machine_id);
                }}
              >
                <div className="cursor-pointer">
                  <MapPin className="size-7" style={{ color: markerColor(point) }} />
                </div>
              </Marker>
            ))}

            {selectedPoint && selectedPoint.latitude != null && selectedPoint.longitude != null ? (
              <Popup
                latitude={selectedPoint.latitude}
                longitude={selectedPoint.longitude}
                anchor="top"
                closeOnClick={false}
                onClose={() => setSelectedId(null)}
              >
                <div className="min-w-44 text-xs">
                  <p className="font-semibold text-slate-900">{selectedPoint.machine_name}</p>
                  <p className="text-slate-600">Status: {selectedPoint.machine_status}</p>
                  <p className="text-slate-600">Source: {selectedPoint.source}</p>
                  {selectedPoint.customer_name ? (
                    <p className="text-slate-600">Customer: {selectedPoint.customer_name}</p>
                  ) : null}
                  <p className="text-slate-600">{selectedPoint.delivery_address ?? selectedPoint.machine_base_location ?? '-'}</p>
                </div>
              </Popup>
            ) : null}
          </Map>
        </div>
      )}

      <Card>
        <p className="mb-2 text-sm font-semibold text-slate-800">Location source for {formatDate(dateOn)}</p>
        <div className="space-y-2">
          {locationsQuery.isLoading ? (
            <p className="text-sm text-slate-500">Loading machine locations...</p>
          ) : filteredPoints.length === 0 ? (
            <p className="text-sm text-slate-500">No machines match this filter.</p>
          ) : (
            filteredPoints.map((point) => (
              <div key={point.machine_id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-medium text-slate-900">{point.machine_name}</p>
                <p className="text-slate-600">Status: {point.machine_status}</p>
                <p className="text-slate-600">Source: {point.source}</p>
                <p className="text-slate-600">{point.delivery_address ?? point.machine_base_location ?? 'No location set'}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
