import React, { useState, useRef, useEffect, useMemo } from "react";
import { Play, RotateCcw, Settings, Plus, ChevronDown } from "lucide-react";
import { RiDeleteBin6Line, RiVoiceprintFill } from "react-icons/ri";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import Button from "../ui/button/Button";
import {
  PiChatTextLight,
  PiPlayLight,
  PiRocketLaunchLight,
} from "react-icons/pi";
import Select, { components } from "react-select";
import { ThemeToggleButton } from "../common/ThemeToggleButton";

interface IStudioScene {
  id: number;
  thumbnail: string;
  duration: string;
  video: string;
}

interface IStudioSpeaker {
  name: string;
  label: string;
  value: string;
}

const speakers: IStudioSpeaker[] = [
  {
    name: "Tatiana 4.0",
    label: "Tatiana 4.0",
    value: "Tatiana 4.0",
  },
  {
    name: "Natiely 2.0",
    label: "Natiely 2.0",
    value: "Natiely 2.0",
  },
];

const mockScenes: IStudioScene[] = [
  {
    id: 1,
    thumbnail: "/videos/example/frames/frame_0:03_1f.jpeg",
    duration: "3s",
    video: "/videos/example/full_without_subtitles.mp4",
  },
  {
    id: 2,
    thumbnail: "/videos/example/frames/frame_0:07_4f.jpeg",
    duration: "2s",
    video: "/videos/example/full_without_subtitles.mp4",
  },
];

const models = [
  {
    value: "model1",
    label: "Ana",
    image: "/videos/example/model/1.png",
  },
  {
    value: "model2",
    label: "Thaís",
    image: "/videos/example/model/2.png",
  },
  {
    value: "model3",
    label: "Vitória",
    image: "/videos/example/model/3.png",
  },
  {
    value: "model4",
    label: "Kamila",
    image: "/videos/example/model/4.png",
  },
  {
    value: "model5",
    label: "Sabrina",
    image: "/videos/example/model/5.png",
  },
];

interface IStudioScript {
  id: number;
  text: string;
  speaker: IStudioSpeaker;
  model: string;
  dropdown: boolean;
}

const mockScripts: IStudioScript[] = [
  {
    id: 1,
    text: "Criar um anúncio incrível em segundos ?",
    speaker: speakers[0],
    dropdown: false,
    model: models[0].value,
  },
  {
    id: 2,
    text: "Crie com Adapta Midia!",
    speaker: speakers[1],
    dropdown: false,
    model: models[0].value,
  },
];

export default function StudioComponent() {
  const [selectedScene, setSelectedScene] = useState<IStudioScene | null>(null);
  //   const videoRef = useRef(null);

  const [scenes, setScenes] = useState<IStudioScene[]>(mockScenes);

  const [scriptLines, setScriptLines] = useState<IStudioScript[]>(mockScripts);

  const updateScriptText = (id: number, newText: string) => {
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
        text: String(),
        speaker: speakers[0],
        dropdown: false,
        model: models[0].value,
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
        thumbnail: String("/videos/default.jpeg"),
        duration: String(),
        video: String(),
      },
    ]);
  };

  const removeScene = (id: number) => {
    if (scenes.length > 1) {
      setScenes((prev) => prev.filter((scene) => scene.id !== id));
      if (selectedScene && selectedScene?.id >= scenes.length - 1) {
        setSelectedScene(null);
      }
    }
  };

  //   const formatTime = (seconds: number) => {
  //     const mins = Math.floor(seconds / 60);
  //     const secs = Math.floor(seconds % 60);
  //     return `${mins}:${secs.toString().padStart(2, "0")}`;
  //   };

  //   const togglePlay = () => {
  //     setIsPlaying(!isPlaying);
  //   };

  //   const toggleMute = () => {
  //     setIsMuted(!isMuted);
  //   };

  // Simulate video progress
  //   useEffect(() => {
  //     let interval: any;
  //     if (isPlaying) {
  //       interval = setInterval(() => {
  //         setCurrentTime((prev) => {
  //           if (prev >= duration) {
  //             setIsPlaying(false);
  //             return 0;
  //           }
  //           return prev + 1;
  //         });
  //       }, 1000);
  //     }
  //     return () => clearInterval(interval);
  //   }, [isPlaying, duration]);

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

  useEffect(() => {
    setSelectedScene(() => mockScenes[0]);
  }, []);

  const ImageWithFallback = ({
    src,
    alt,
    style,
    fallbackIcon: FallbackIcon,
  }: any) => {
    const [imageError, setImageError] = useState(false);

    if (imageError) {
      return <FallbackIcon style={style} />;
    }

    return (
      <img
        src={src}
        alt={alt}
        style={style}
        onError={() => setImageError(true)}
      />
    );
  };

  const speakerOptions = useMemo(() => speakers, [speakers]);

  return (
    <>
      <div className=" dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between my-2 mx-4 flex-shrink-0 ">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Adapta Mídia - Studio
            </h1>
            {/* <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm font-medium">
              Brand Kit ⚡
            </span> */}
          </div>
          <div className="flex items-center space-x-3">
            <Button size="xs" variant="outline" startIcon={<PiChatTextLight />}>
              <span className="font-light">Feedback</span>
            </Button>
            <ThemeToggleButton />
            <Button size="xs" variant="primary" startIcon={<PiPlayLight />}>
              <span className="font-light">Preview</span>
            </Button>
            <Button
              size="xs"
              variant="primary"
              className="bg-purple-600 hover:bg-purple-800"
              startIcon={<PiRocketLaunchLight />}
            >
              <span className="font-light">Generate</span>
            </Button>
          </div>
        </div>
      </div>
      <div className="h-screen bg-gray-50 dark:bg-gray-900 p-4 overflow-hidden">
        <div className="h-full flex flex-col max-w-full ">
          <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
            {/* Left Sidebar - Script */}
            <div className="col-span-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Adapta Mídia
                </h3>
                {/* <button
                  onClick={addScriptLine}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button> */}
              </div>

              <div className="space-y-4">
                {scriptLines.map((line, index) => (
                  <div
                    key={line.id}
                    className="border border-gray-100 dark:border-gray-600 rounded-lg p-4"
                  >
                    <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
                      <div className="col-span-1 dark:text-white">
                        <div className="mt-1.5">{index + 1}</div>
                      </div>
                      <div className="col-span-11">
                        <div className="flex items-center mb-2 gap-3">
                          <div>
                            <Select
                              placeholder={`Modelo`}
                              className="text-sm"
                              value={
                                models.find(
                                  (option) => option.value === line?.model
                                ) || null
                              }
                              onChange={(newValue) => {
                                setScriptLines((prev) =>
                                  prev.map((item) =>
                                    line.id === item.id
                                      ? {
                                          ...item,
                                          model: newValue?.value || String(),
                                        }
                                      : item
                                  )
                                );
                              }}
                              options={models}
                              isSearchable={false}
                              components={{
                                Option: (props) => {
                                  return (
                                    <components.Option {...props}>
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "8px",
                                        }}
                                      >
                                        <ImageWithFallback
                                          src={props.data.image}
                                          alt={props.data.label}
                                          style={{
                                            width: "24px",
                                            height: "24px",
                                            borderRadius: "4px",
                                            objectFit: "cover",
                                          }}
                                          fallbackIcon={RiVoiceprintFill}
                                        />
                                        {props.data.label}
                                      </div>
                                    </components.Option>
                                  );
                                },
                                SingleValue: (props) => {
                                  return (
                                    <components.SingleValue {...props}>
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "8px",
                                        }}
                                      >
                                        <ImageWithFallback
                                          src={props.data.image}
                                          alt={props.data.label}
                                          style={{
                                            width: "20px",
                                            height: "20px",
                                            borderRadius: "4px",
                                            objectFit: "cover",
                                          }}
                                          fallbackIcon={RiVoiceprintFill}
                                        />
                                        {props.data.label}
                                      </div>
                                    </components.SingleValue>
                                  );
                                },
                              }}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Select
                              placeholder={`Selecione o speaker`}
                              className="text-sm"
                              value={
                                speakerOptions.find(
                                  (option) =>
                                    option.value === line?.speaker?.value
                                ) || null
                              }
                              options={speakerOptions}
                              isSearchable={false}
                              onChange={(newValue) => {
                                const getSpeaker = speakerOptions.find(
                                  (item) => item.value === newValue?.value
                                );

                                if (getSpeaker) {
                                  setScriptLines((prev) =>
                                    prev.map((item) =>
                                      line.id === item.id
                                        ? {
                                            ...item,
                                            speaker: getSpeaker,
                                          }
                                        : item
                                    )
                                  );
                                }
                              }}
                              components={{
                                Option: (props) => {
                                  return (
                                    <components.Option {...props}>
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "8px",
                                        }}
                                      >
                                        <RiVoiceprintFill />
                                        {props.data.label}
                                      </div>
                                    </components.Option>
                                  );
                                },
                                SingleValue: (props) => {
                                  return (
                                    <components.SingleValue {...props}>
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "8px",
                                        }}
                                      >
                                        <RiVoiceprintFill />
                                        {props.data.label}
                                      </div>
                                    </components.SingleValue>
                                  );
                                },
                              }}
                            />
                            <div>
                              <Button
                                size="xs"
                                variant="outline"
                                startIcon={<Play size={16} />}
                              ></Button>
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
                                className="absolute top-full z-[99999] mt-2 w-full min-w-[260px] rounded-2xl border border-gray-100 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-[#1E2635]"
                              >
                                <ul className="flex flex-col gap-1 ">
                                  <li>
                                    <DropdownItem
                                      onItemClick={() =>
                                        removeScriptLine(line.id)
                                      }
                                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                                    >
                                      <Play size={16} />
                                      <span className="text-sm font-light">
                                        Preview Áudio
                                      </span>
                                    </DropdownItem>
                                  </li>
                                  {scriptLines.length > 0 && (
                                    <li>
                                      <DropdownItem
                                        onItemClick={() =>
                                          removeScriptLine(line.id)
                                        }
                                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                                      >
                                        <RiDeleteBin6Line />
                                        <span className="text-sm font-light">
                                          Delete
                                        </span>
                                      </DropdownItem>
                                    </li>
                                  )}
                                </ul>
                              </Dropdown>
                            </div>
                          </div>
                        </div>

                        <textarea
                          value={line.text}
                          onChange={(e) =>
                            updateScriptText(line.id, e.target.value)
                          }
                          className="w-full h-20 text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Digite seu texto aqui..."
                        />

                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
                          <button
                            onClick={addScriptLine}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          {/* <span>Auto</span>
                      <span>Pause</span>
                      <span>Voice Director</span> */}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-8 flex flex-col min-h-0">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex-1 flex flex-col">
                <div className="bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                  <div
                    className="relative w-full max-w-[50vw]"
                    style={{ height: "60vh" }}
                  >
                    <video
                      src={selectedScene?.video}
                      className="h-full w-full object-contain"
                      controls
                      poster={selectedScene?.thumbnail}
                    ></video>
                  </div>
                </div>

                {/* Timeline */}
                <div className="p-4 border-gray-100 dark:border-gray-700 flex-shrink-0">
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
                    {scenes.map((scene) => (
                      <div
                        key={scene.id}
                        className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all flex-shrink-0 group ${
                          selectedScene?.id === scene.id
                            ? "border-blue-500 dark:border-blue-400"
                            : "border-gray-100 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                        onClick={() => setSelectedScene(scene)}
                      >
                        <img
                          src={scene.thumbnail}
                          alt={`Scene ${scene.id}`}
                          className="w-20 h-12 object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5">
                          {scene.duration}
                        </div>
                        {selectedScene?.id === scene.id && (
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
          </div>
        </div>
      </div>
    </>
  );
}
