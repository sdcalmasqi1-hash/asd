/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { buildMembershipVerifyUrl } from "../lib/api";

export function MembershipQrCode({
  memberId,
  size = 120,
  className = ""
}: {
  memberId: string;
  size?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !memberId) return;

    setFailed(false);
    const url = buildMembershipVerifyUrl(memberId);

    QRCode.toCanvas(canvas, url, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" }
    }).catch(() => setFailed(true));
  }, [memberId, size]);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-white text-[10px] text-slate-500 font-bold ${className}`}
        style={{ width: size, height: size }}
      >
        QR
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-label={`رمز QR للتحقق من العضوية ${memberId}`}
    />
  );
}

/** Generate QR as data URL for card download */
export async function renderMembershipQrDataUrl(memberId: string, size = 140): Promise<string> {
  const url = buildMembershipVerifyUrl(memberId);
  return QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" }
  });
}
