import React, { useState, useEffect } from "react";

export const AdsSidebar = () => {
  const [dateInfo, setDateInfo] = useState({ day: "", date: "" });
  const [location, setLocation] = useState("Localizando...");
  const [temperature, setTemperature] = useState<number>(0);

  useEffect(() => {
    // Obter data atual
    const now = new Date();
    const formattedDate = now.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "short",
    });
    setDateInfo({
      day: formattedDate.split(",")[0],
      date: formattedDate.split(",")[1],
    });

    // Obter localização do usuário
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
            .then((res) => res.json())
            .then((data) => {
              setLocation(
                `${data.address.city || data.address.town}, ${
                  data.address.state
                }`
              );
            });

          // Obter temperatura da API OpenWeather
          //   const apiKey = "SUA_API_KEY_AQUI"; // Substituir pela chave real
          //   fetch(
          //     `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&lang=pt_br&appid=${apiKey}`
          //   )
          //     .then((res) => res.json())
          //     .then((data) => {
          //       setTemperature(Math.round(data.main.temp || 0));
          //     });
          setTemperature(20);
        },
        () => setLocation("Localização não permitida")
      );
    }
  }, []);

  return (
    <div className="relative h-full w-3/12 z-50 flex items-center justify-center text-white text-3xl bg-brand-500">
      <div className=" h-screen text-white flex flex-col items-center p-6 w-full">
        <div className="my-auto  w-full">
          <div className="w-full bg-brand-600 p-4 rounded-lg mb-10">
            <div className="text-center">
              <p className="text-lg capitalize">
                {dateInfo.day} | {dateInfo.date}
              </p>
              <p className="text-xl font-semibold">{location}</p>
            </div>
            <div className="flex flex-col items-center my-6">
              <div className="text-6xl">☁️</div>
              <p className="text-xl">Nublado</p>
              <p className="text-5xl">
                {temperature !== null ? `${temperature}°C` : "Carregando..."}
              </p>
            </div>
            <div className="flex justify-center gap-3 text-sm">
              <div className="text-center">
                <p>Sun</p>
                <p>🌙</p>
                <p>27°</p>
              </div>
              <div className="text-center">
                <p>Mon</p>
                <p>☀️</p>
                <p>29°</p>
              </div>
              <div className="text-center">
                <p>Tue</p>
                <p>🌥️</p>
                <p>27°</p>
              </div>
              <div className="text-center">
                <p>Wed</p>
                <p>☁️</p>
                <p>27°</p>
              </div>
              <div className="text-center">
                <p>Thu</p>
                <p>🌧️</p>
                <p>27°</p>
              </div>
            </div>
          </div>
          <div className="w-full bg-brand-600 p-4 rounded-lg">
            <h3 className="text-lg font-semibold">SEA FORECAST REPORT</h3>
            <ul className="text-sm mt-2 space-y-1">
              <li>
                WIND SPEED (KNOTS): <span className="font-bold">5.1</span>
              </li>
              <li>
                WIND GUSTS (KNOTS): <span className="font-bold">5.4</span>
              </li>
              <li>
                WIND DIRECTION: <span className="font-bold">NW</span>
              </li>
              <li>
                WAVE HEIGHT (M): <span className="font-bold">1.3</span>
              </li>
              <li>
                WAVE PERIOD (S): <span className="font-bold">13</span>
              </li>
              <li>
                WAVE DIRECTION: <span className="font-bold">SW</span>
              </li>
              <li>
                TEMPERATURE (°C): <span className="font-bold">21</span>
              </li>
              <li>
                CLOUD COVER (%): <span className="font-bold">75</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
