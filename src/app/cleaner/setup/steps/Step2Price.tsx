"use client";

import { useState } from "react";

interface Step2PriceProps {
    onNext: (data: { pricePerHour: number }) => void;
    onBack: () => void;
    initialData: { pricePerHour?: number };
}

export default function Step2Price({ onNext, onBack, initialData }: Step2PriceProps) {
  const [price, setPrice] = useState(initialData.pricePerHour || 0);

  const handleContinue = () => {
    if (price <= 0) {
      alert("Please set a valid hourly price.");
      return;
    }
    onNext({ pricePerHour: price });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Step 2: Set Your Price</h2>
      <input
        type="number"
        placeholder="Price per hour (€)"
        className="border p-2 rounded w-full mb-4"
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
      />
      <div className="flex justify-between">
        <button onClick={onBack} className="bg-gray-300 px-4 py-2 rounded">
          Back
        </button>
        <button
          onClick={handleContinue}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
