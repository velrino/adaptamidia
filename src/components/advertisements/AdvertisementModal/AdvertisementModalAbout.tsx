"use client";
import React, { useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";

export default function AdvertisementModalAbout() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <Label htmlFor="title">Título</Label>
        <Input type="text" placeholder="Informe o título" id="title" />
      </div>
    </div>
  );
}
