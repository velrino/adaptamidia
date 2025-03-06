"use client";
import React, { useEffect, useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { AdvertisementModalCommonProps } from "./interface";
import { IApiAdvertisementItem } from "@/backend/api/api.interface";
import { useDynamicForm } from "@/utils/form";

export default function AdvertisementModalAbout(
  params: AdvertisementModalCommonProps
) {
  const { formData, handleChange } = useDynamicForm<IApiAdvertisementItem>(
    params.data
  );

  useEffect(() => {
    if (params.onCallback && formData) {
      params.onCallback(formData);
    }
  }, [params, formData]);

  return (
    <>
      {formData && (
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              type="text"
              placeholder="Informe o título"
              id="title"
              value={formData?.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
          </div>
        </div>
      )}
    </>
  );
}
