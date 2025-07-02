/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Download,
  Share2,
  Settings,
  Plus,
  ChevronDown,
} from "lucide-react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

export default function StudioComponent() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(45);
  const [selectedScene, setSelectedScene] = useState(0);
  const videoRef = useRef(null);

  const [scenes, setScenes] = useState([
    {
      id: 1,
      thumbnail: "/videos/example/frames/frame_0:03_1f.jpeg",
      duration: "3s",
    },
    {
      id: 2,
      thumbnail: "/videos/example/frames/frame_0:07_4f.jpeg",
      duration: "2s",
    },
  ]);

  const [scriptLines, setScriptLines] = useState([
    {
      id: 1,
      text: "Criar um anúncio incrível em segundos ?",
      speaker: "VERA4.0 - Voice 1",
      dropdown: false,
    },
    {
      id: 2,
      text: "Crie com AlphaMidia!",
      speaker: "VERA4.0 - Voice 1",
      dropdown: false,
    },
  ]);

  const updateScriptText = (id, newText) => {
    setScriptLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, text: newText } : line))
    );
  };

  const addScriptLine = () => {
    const newId = Math.max(...scriptLines.map((line) => line.id)) + 1;
    setScriptLines((prev) => [
      ...prev,
      {
        id: newId,
        text: "Nova linha de script...",
        speaker: "VERA4.0 - Voice 1",
        dropdown: false,
      },
    ]);
  };

  const removeScriptLine = (id) => {
    if (scriptLines.length > 1) {
      setScriptLines((prev) => prev.filter((line) => line.id !== id));
    }
  };

  const addScene = () => {
    const newId = Math.max(...scenes.map((scene) => scene.id)) + 1;
    setScenes((prev) => [
      ...prev,
      {
        id: newId,
        thumbnail: "/api/placeholder/100/60",
        duration: "2s",
      },
    ]);
  };

  const removeScene = (id: number) => {
    if (scenes.length > 1) {
      setScenes((prev) => prev.filter((scene) => scene.id !== id));
      if (selectedScene >= scenes.length - 1) {
        setSelectedScene(0);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Simulate video progress
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  //   const [isOpen, setIsOpen] = useState(true);

  function toggleDropdown(id: number) {
    setScriptLines((prev) =>
      prev.map((line) =>
        line.id === id ? { ...line, dropdown: !line.dropdown } : line
      )
    );
  }

  const closeDropdown = (id: number) => {
    setScriptLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, dropdown: false } : line))
    );
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 p-4 overflow-hidden">
      <div className="h-full flex flex-col max-w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Adapta Studio
            </h1>
            {/* <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm font-medium">
              Brand Kit ⚡
            </span> */}
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              Feedback
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Preview
            </button>
            <button className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
              Generate
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
          {/* Left Sidebar - Script */}
          <div className="col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Adapta Mídia
              </h3>
              <button
                onClick={addScriptLine}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {scriptLines.map((line, index) => (
                <div
                  key={line.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white mr-3">
                      {index + 1}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">V</span>
                      </div>
                      <select className="text-sm text-gray-600 dark:text-gray-300 bg-transparent border-none focus:outline-none">
                        <option>{line.speaker}</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                      <div>
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          <Play className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>

                    <div className="ml-auto">
                      <div className="relative inline-block">
                        <button
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          onClick={() => toggleDropdown(line.id)}
                        >
                          <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>

                        <Dropdown
                          isOpen={line.dropdown}
                          onClose={() => closeDropdown(line.id)}
                          className="absolute top-full z-[99999] mt-2 w-full min-w-[260px] rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-[#1E2635]"
                        >
                          <ul className="flex flex-col gap-1">
                            <li>
                              <DropdownItem
                                onItemClick={() => closeDropdown(line.id)}
                                className="flex rounded-lg px-3 py-2.5 text-sm font-medium
              text-gray-700 hover:bg-gray-100 dark:text-gray-300
              dark:hover:bg-white/5"
                              >
                                Edit Profile
                              </DropdownItem>
                            </li>
                            <li>
                              <DropdownItem
                                onItemClick={() => closeDropdown(line.id)}
                                className="flex rounded-lg px-3 py-2.5 text-sm font-medium
              text-gray-700 hover:bg-gray-100 dark:text-gray-300
              dark:hover:bg-white/5"
                              >
                                Account Settings
                              </DropdownItem>
                            </li>
                            <li>
                              <DropdownItem
                                onItemClick={() => closeDropdown(line.id)}
                                className="flex rounded-lg px-3 py-2.5 text-sm font-medium
              text-gray-700 hover:bg-gray-100 dark:text-gray-300
              dark:hover:bg-white/5"
                              >
                                License
                              </DropdownItem>
                            </li>
                            <li>
                              <DropdownItem
                                onItemClick={() => closeDropdown(line.id)}
                                className="flex rounded-lg px-3 py-2.5 text-sm font-medium
              text-gray-700 hover:bg-gray-100 dark:text-gray-300
              dark:hover:bg-white/5"
                              >
                                Support
                              </DropdownItem>
                            </li>
                          </ul>
                        </Dropdown>
                      </div>
                    </div>
                  </div>

                  <textarea
                    value={line.text}
                    onChange={(e) => updateScriptText(line.id, e.target.value)}
                    className="w-full h-20 text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite seu texto aqui..."
                  />

                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>Score</span>
                    <span>Auto</span>
                    <span>Pause</span>
                    <span>Voice Director</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Video Area */}
          <div className="col-span-6 flex flex-col min-h-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex-1 flex flex-col">
              {/* Video Player */}
              <div className="relative flex-1 bg-gradient-to-br from-blue-400 via-cyan-400 to-blue-500">
                <img
                  src="/api/placeholder/800/450"
                  alt="Video preview"
                  className="w-full h-full object-cover"
                />

                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={togglePlay}
                    className="w-16 h-16 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center transition-all"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
                  </button>
                </div>

                {/* Top controls */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg transition-all">
                    <Share2 className="w-4 h-4 text-white" />
                  </button>
                  <button className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-lg transition-all">
                    <Download className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Bottom controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={togglePlay}
                      className="text-white hover:text-gray-300 transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </button>

                    <span className="text-white text-sm font-medium">
                      {formatTime(currentTime)}
                    </span>

                    <div className="flex-1 bg-gray-600 rounded-full h-1">
                      <div
                        className="bg-white rounded-full h-1 transition-all duration-300"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                    </div>

                    <span className="text-white text-sm">
                      {formatTime(duration)}
                    </span>

                    <button
                      onClick={toggleMute}
                      className="text-white hover:text-gray-300 transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Timeline
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                      <RotateCcw className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={addScene}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="flex space-x-2 overflow-x-auto">
                  {scenes.map((scene, index) => (
                    <div
                      key={scene.id}
                      className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all flex-shrink-0 group ${
                        selectedScene === index
                          ? "border-blue-500 dark:border-blue-400"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                      onClick={() => setSelectedScene(index)}
                    >
                      <img
                        src={scene.thumbnail}
                        alt={`Scene ${scene.id}`}
                        className="w-20 h-12 object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5">
                        {scene.duration}
                      </div>
                      {selectedScene === index && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      {scenes.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeScene(scene.id);
                          }}
                          className="absolute top-1 left-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Add scene button */}
                  <button
                    onClick={addScene}
                    className="w-20 h-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex-shrink-0"
                  >
                    <Plus className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Tools */}
          <div className="col-span-3 space-y-4 overflow-y-auto">
            {/* Avatars */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded mr-2 flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-300 text-sm">
                    👤
                  </span>
                </div>
                Avatars
              </h3>
            </div>

            {/* Text */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded mr-2 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-300 text-sm">
                    T
                  </span>
                </div>
                Text
              </h3>
            </div>

            {/* Media */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded mr-2 flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-300 text-sm">
                    📷
                  </span>
                </div>
                Media
              </h3>
            </div>

            {/* Elements */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded mr-2 flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-300 text-sm">
                    ⭐
                  </span>
                </div>
                Elements
              </h3>
            </div>

            {/* Captions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded mr-2 flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-300 text-sm">
                    💬
                  </span>
                </div>
                Captions
              </h3>
            </div>

            {/* Background */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded mr-2 flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-300 text-sm">
                    🖼️
                  </span>
                </div>
                Background
              </h3>
            </div>

            {/* Layers */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 rounded mr-2 flex items-center justify-center">
                  <span className="text-indigo-600 dark:text-indigo-300 text-sm">
                    📄
                  </span>
                </div>
                Layers
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
