"use client";

// START: Preserve spaces to avoid auto-sorting
import "leaflet/dist/leaflet.css";

import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css";

import "leaflet-defaulticon-compatibility";
// END: Preserve spaces to avoid auto-sorting
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { IApiUnitItemResponse } from "@/backend/api/api.interface";
// import { type Map as LeafletMap } from "leaflet";

// import { useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface MapProps {
  style?: {
    minHeight?: number;
  };
  list: any[];
}

const calculateCenter = (list: IApiUnitItemResponse[]) => {
  if (!list || list.length === 0) {
    return { lat: -23.5475, lng: -46.63611 }; // Retorna coordenadas padrão se a lista estiver vazia
  }

  let totalLat = 0;
  let totalLng = 0;

  list.forEach((item) => {
    const [lng, lat] = item.location.coordinates;
    totalLat += lat;
    totalLng += lng;
  });

  const centerLat = totalLat / list.length;
  const centerLng = totalLng / list.length;

  return {
    lat: centerLat && centerLat !== 0 ? centerLat : -23.5475,
    lng: centerLng && centerLng !== 0 ? centerLng : -46.63611,
  };
};

const calculateZoom = (list: IApiUnitItemResponse[]) => {
  if (!list || list.length === 0) {
    return 8; // Zoom mínimo se a lista estiver vazia
  }

  // Extrai todas as latitudes e longitudes
  const lats = list.map((item) => item.location.coordinates[1]);
  const lngs = list.map((item) => item.location.coordinates[0]);

  // Calcula a diferença entre as latitudes e longitudes
  const latDiff = Math.max(...lats) - Math.min(...lats);
  const lngDiff = Math.max(...lngs) - Math.min(...lngs);

  // Ajusta o zoom com base na diferença
  const maxDiff = Math.max(latDiff, lngDiff);

  if (maxDiff <= 0.01) return 15; // Zoom alto para áreas pequenas
  if (maxDiff <= 0.1) return 13; // Zoom médio para áreas médias
  if (maxDiff <= 1) return 11; // Zoom baixo para áreas grandes
  return 10; // Zoom mínimo para áreas muito grandes
};

export default function AdvertisementMap(parameters: MapProps) {
  if (L.DomUtil.get("map") !== undefined) {
    L.DomUtil.get("map")?.remove();
  }

  const center = calculateCenter(parameters.list);
  const zoom = calculateZoom(parameters.list);

  return (
    <div className="max-h-[75vh]">
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={3}
        scrollWheelZoom={true}
        maxBounds={[
          [-90, -180], // Limite sul-oeste
          [90, 180], // Limite norte-leste
        ]}
        maxBoundsViscosity={1.0} // Impede que o mapa saia dos limites
        style={{
          height: "100%",
          width: "100%",
          // ...parameters.style,
          minHeight: parameters.style?.minHeight || "75vh",
          maxHeight: "75vh",
        }}
        className="max-h-[75vh]"
        // {...parameters?.customMapContainer}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          noWrap={true}
          bounds={[
            [-90, -180],
            [90, 180],
          ]}
        />
        {parameters.list.map((item: IApiUnitItemResponse) => (
          <Marker
            key={item._id}
            position={[
              item.location.coordinates[1],
              item.location.coordinates[0],
            ]}
            eventHandlers={{
              click: () => {
                // if (parameters.enableClickPopUp) {
                //   setSelectedItem(item);
                // }
              },
            }}
          >
            {
              <Popup className="space-y-2">
                <div className="font-bold my-2">{item.name}</div>
                {[
                  {
                    label: "neighborhood",
                    value: `${item.neighborhood}, ${item.city}`,
                  },
                  { label: "State", value: item.state },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="font-bold">{label}:</span>
                    <span>{value}</span>
                  </div>
                ))}
              </Popup>
            }
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
