"use client";

import { useState } from "react";
import { SERVICES_BASIC } from "../../../../lib/constants";
import { useLanguage } from "../../../../context/LanguageContext";

interface Step2PriceProps {
    onNext: (data: { pricePerHour: number; services: string[] }) => void;
    onBack: () => void;
    initialData: { pricePerHour?: number; services?: string[] };
}

export default function Step2Price({ onNext, onBack, initialData }: Step2PriceProps) {
  const { t } = useLanguage();
  const [price, setPrice] = useState(initialData.pricePerHour || 0);
  const [selectedServices, setSelectedServices] = useState<string[]>(initialData.services || []);

  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const handleContinue = () => {
    if (price <= 0) {
      alert(t('cleanerSetup.step2.validPrice'));
      return;
    }
    if (selectedServices.length === 0) {
      alert(t('cleanerSetup.step2.selectService'));
      return;
    }
    onNext({ pricePerHour: price, services: selectedServices });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{t('cleanerSetup.step2.title')}</h2>

      {/* Price Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">{t('cleanerSetup.step2.hourlyRate')}</label>
        <input
          type="number"
          placeholder={t('cleanerSetup.step2.pricePlaceholder')}
          className="border p-2 rounded w-full"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
      </div>

      {/* Services Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">{t('cleanerSetup.step2.servicesOffered')}</label>
        <p className="text-xs text-gray-600 mb-3">{t('cleanerSetup.step2.selectAll')}</p>
        <div className="grid grid-cols-1 gap-2">
          {SERVICES_BASIC.map((service) => (
            <label
              key={service.id}
              className={`flex items-center p-3 border rounded cursor-pointer transition ${
                selectedServices.includes(service.id)
                  ? "bg-green-50 border-green-500"
                  : "bg-white border-gray-300 hover:border-green-300"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedServices.includes(service.id)}
                onChange={() => toggleService(service.id)}
                className="mr-3 w-5 h-5"
              />
              <span className="text-sm font-medium">{service.name}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {selectedServices.length} {t('cleanerSetup.step2.servicesSelected')}
        </p>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="bg-gray-300 px-4 py-2 rounded">
          {t('common.back')}
        </button>
        <button
          onClick={handleContinue}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          {t('common.continue')}
        </button>
      </div>
    </div>
  );
}
