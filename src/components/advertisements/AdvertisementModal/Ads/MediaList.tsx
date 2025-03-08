import React, { forwardRef, useRef, useState } from "react";
import { IAdvertisementFormItem } from "@/interfaces/ads";
import Image from "next/image";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

import { SmartPointerSensor } from "@/utils/dnd";
import { ImageCropperModal } from "./ImageCropperModal";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import { Modal } from "@/components/ui/modal";

interface ScrollableListProps {
  items: IAdvertisementFormItem[];
  onUpdate: (updatedItems: IAdvertisementFormItem[]) => void;
  onCropComplete: (croppedImage: Blob) => void;
}

interface AdItemProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
}

export const SortableAdItem = forwardRef<HTMLDivElement, any>(
  (
    {
      id,
      item,
      index,
      handleTitleChange,
      handleSecondsChange,
      // handleDescriptionChange,
      onDelete,
      ...props
    },
    ref
  ) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const [showDelete, setShowDelete] = useState<boolean>(false);
    return (
      <>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          {...props}
          className="shrink-0 w-[300px] mr-5"
        >
          <div className="relative flex items-center justify-center w-full">
            <div className="font-bold text-xl p-2 rounded">{index + 1}</div>
            <div>
              <button
                className="absolute right-0 flex items-center justify-center w-8 h-8 bg-red-500 rounded-full cursor-pointer"
                onClick={() => {
                  setShowDelete(true);
                }}
              >
                DEFHCAR
                {/* <X aria-hidden="true" className="h-6 w-6 text-white" /> */}
              </button>
            </div>
          </div>

          <Image
            src={item.source}
            alt="Item"
            width={500}
            height={100}
            className="w-full min-h-[50px] max-h-[100px] rounded-sm object-cover"
          />
          <div className="my-2">
            <div>
              <Input
                placeholder="Título"
                value={item.title || ""}
                onChange={(event) =>
                  handleTitleChange(index, event.target.value)
                }
              />
            </div>
            <div className="mt-2">
              <Input
                placeholder="Segundos"
                value={item.seconds}
                onChange={(event) =>
                  handleSecondsChange(index, event.target.value)
                }
                // onKeyDown={(event) => {
                //   if (
                //     !/[\d\bArrowLeftArrowRight]/.test(event.key) &&
                //     event.key !== "Delete"
                //   ) {
                //     event.preventDefault();
                //   }
                // }}
                // onInput={(event) => {
                //   const input = event.target as HTMLInputElement;
                //   input.value = input.value.replace(/\D/g, "");
                // }}
              />
            </div>
            <div className="mt-2">
              <TextArea
                rows={5}
                placeholder="Descrição"
                value={item.description || ""}
                // onChange={(event) => {
                //   const value = event.target.value.slice(0, 255); // Limita a 255 caracteres
                //   handleDescriptionChange(index, value);
                // }}
                className="resize-none max-h-[200px]"
              />
              <div className="text-right text-sm text-gray-500">
                {item.description.length}/255
              </div>
            </div>
          </div>
        </div>

        <Modal
          isOpen={showDelete}
          onClose={() => setShowDelete(false)}
          showCloseButton={false}
          className="min-w-[95vw] max-w-[95vw] min-h-[95vh] p-6 lg:p-10 flex flex-col"
        >
          <div className="text-lg font-bold">Remover</div>
          <p className="mb-6">Tem certeza que deseja excluir este item?</p>
          <div className="flex justify-between gap-2">
            <button
              onClick={() => setShowDelete(false)}
              className="px-4 py-2 rounded-lg hover:text-gray-700 hover:bg-gray-300 transition"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onDelete();
                setShowDelete(false);
              }}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
            >
              Excluir
            </button>
          </div>
        </Modal>
      </>
    );
  }
);

SortableAdItem.displayName = "SortableAdItem";

export const AdvertisementItems: React.FC<ScrollableListProps> = ({
  items,
  onUpdate,
  onCropComplete,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    isDragging.current = true;
    startX.current = event.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeft.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !scrollContainerRef.current) return;
    event.preventDefault();
    const x = event.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 2; // Sensibilidade do scroll
    scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleTitleChange = (index: number, newTitle: string) => {
    const updatedItems = items.map((item, i) =>
      i === index ? { ...item, title: newTitle } : item
    );
    onUpdate(updatedItems);
  };

  const handleDescriptionChange = (index: number, newDescription: string) => {
    const updatedItems = items.map((item, i) =>
      i === index ? { ...item, description: newDescription } : item
    );
    onUpdate(updatedItems);
  };

  const handleSecondsChange = (index: number, value: string) => {
    let num = Number(value);

    if (isNaN(num)) {
      num = 1; // Define 1 se não for um número
    } else {
      if (num < 1) num = 1; // Mínimo permitido: 1
      if (num > 60) num = 60; // Máximo permitido: 60
    }

    onUpdate(
      items.map((item, i) => (i === index ? { ...item, seconds: num } : item))
    );
  };

  const sensors = useSensors(useSensor(SmartPointerSensor));

  const handleRemoveItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onUpdate(updatedItems);
  };

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const updatedItems = [...items];
        updatedItems.splice(oldIndex, 1);
        updatedItems.splice(newIndex, 0, items[oldIndex]);

        onUpdate(updatedItems);
      }
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={horizontalListSortingStrategy}>
          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseUp}
            onMouseUp={handleMouseUp}
            className="flex gap-4 overflow-x-auto min-h-[60vh] max-h-[60vh] cursor-grab active:cursor-grabbing p-0 px-2"
          >
            {items.map((item, index) => (
              <SortableAdItem
                key={item.id}
                id={item.id}
                item={item}
                index={index}
                handleTitleChange={handleTitleChange}
                handleSecondsChange={handleSecondsChange}
                handleDescriptionChange={handleDescriptionChange}
                onDelete={() => handleRemoveItem(index)}
              />
            ))}
            <div className="mx-3 my-auto">
              <ImageCropperModal
                open={true}
                onClose={() => console.log("Fechar")}
                onCropComplete={onCropComplete}
              />
            </div>
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
};
