"use client";

// START: Preserve spaces to avoid auto-sorting
import "leaflet/dist/leaflet.css";

import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css";

import "leaflet-defaulticon-compatibility";
// END: Preserve spaces to avoid auto-sorting
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
// import { type Map as LeafletMap } from "leaflet";

// import { useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface MapProps {
  style?: {
    minHeight?: number;
  };
  list: any[];
}

export default function AdvertisementMap(parameters: MapProps) {
  if (L.DomUtil.get("map") !== undefined) {
    L.DomUtil.get("map")?.remove();
  }

  return (
    <>
      <MapContainer
        center={[
          parameters.list?.[0]?.location.coordinates[1] || 0,
          parameters.list?.[0]?.location.coordinates[0] || 0,
        ]}
        zoom={13}
        minZoom={3}
        // maxZoom={6}
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
          minHeight: parameters.style?.minHeight || 500,
          maxHeight: 500,
        }}
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
        {parameters.list.map((item) => (
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
            {/* {(parameters.enableClickPopUp === true) && (
                            <Popup className="space-y-2">
                                <div className="font-bold my-2">{server.node_name}</div>
                                {[
                                    { label: "IP", value: server.ip },
                                    { label: "City", value: `${server.city}, ${server.country_name}` },
                                    { label: "Status", value: server.status },
                                    { label: "Criado", value: dayjs(server.createdAt).format("DD/MM/YYYY HH:mm:ss") },
                                    { label: "Verificado", value: dayjs(server.verifiedAt).format("DD/MM/YYYY HH:mm:ss") },
                                    { label: "Atualizado", value: dayjs(server.updatedAt).format("DD/MM/YYYY HH:mm:ss") },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between">
                                        <span className="font-bold">{label}:</span>
                                        <span>{value}</span>
                                    </div>
                                ))}
                            </Popup>
                        )} */}
          </Marker>
        ))}
      </MapContainer>
      {/* {parameters.enableClickPopUp && selectedItem && (
        <UnitDetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )} */}
    </>
  );
}
