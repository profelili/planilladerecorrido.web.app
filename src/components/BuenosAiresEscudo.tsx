/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export default function BuenosAiresEscudo({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <img
      src="https://lh3.googleusercontent.com/d/167YEMiMDVOvZuWug41smCg3_0BMo5d_I"
      alt="Escudo Oficial de la Ciudad de Buenos Aires"
      className={`${className} object-contain`}
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
    />
  );
}


