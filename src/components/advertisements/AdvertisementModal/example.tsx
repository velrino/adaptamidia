import Input from "@/components/form/input/InputField";
import { Tabs } from "@/components/ui/tabs/Principal";
import React, { useState } from "react";

// Definição do tipo do objeto
interface SharedObject {
  name: string;
  age: number;
}

// Componente Pai
const ParentComponent: React.FC = () => {
  // Estado compartilhado entre os componentes filhos
  const [data, setData] = useState<SharedObject>({ name: "John Doe", age: 25 });

  // Função para atualizar os dados
  const handleUpdate = (updatedData: Partial<SharedObject>) => {
    setData((prev) => ({ ...prev, ...updatedData }));
  };

  // Função para enviar os dados para a API
  const sendDataToAPI = async () => {
    console.log({ data });
  };

  const tabs = [
    {
      id: "LOCAL",
      label: "ONE",
      content: <TabOne data={data} onUpdate={handleUpdate} />,
    },
    {
      id: "ABOUT",
      label: "TWO",
      content: <TabTwo data={data} onUpdate={handleUpdate} />,
    },
  ];

  return (
    <div>
      <Tabs
        tabs={tabs}
        defaultTabId="LOCAL"
        styles={{
          nav: "-6",
          navMenu: "mx-auto",
        }}
      />
      <div onClick={sendDataToAPI}>Send API</div>
    </div>
  );
};

// Componente Tab 1
const TabOne: React.FC<{
  data: SharedObject;
  onUpdate: (data: Partial<SharedObject>) => void;
}> = ({ data, onUpdate }) => {
  return (
    <div className="space-y-2">
      <p>Name: {data.name}</p>
      <p>Age: {data.age}</p>
      <Input
        type="text"
        value={data.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="Edit Name"
      />
    </div>
  );
};

// Componente Tab 2
const TabTwo: React.FC<{
  data: SharedObject;
  onUpdate: (data: Partial<SharedObject>) => void;
}> = ({ data, onUpdate }) => {
  return (
    <div className="space-y-2">
      <p>Name: {data.name}</p>

      <p>Age: {data.age}</p>
      <Input
        type="number"
        value={data.age}
        onChange={(e) => onUpdate({ age: Number(e.target.value) })}
        placeholder="Edit Age"
      />
    </div>
  );
};

export default ParentComponent;
