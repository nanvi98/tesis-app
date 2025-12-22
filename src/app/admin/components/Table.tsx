"use client";

import { ReactNode } from "react";

interface TableProps {
  headers: ReactNode[];
  children: ReactNode;
}

export default function Table({ headers, children }: TableProps) {
  return (
    <div className="overflow-hidden rounded-3xl backdrop-blur-xl bg-white/20 border border-white/40 shadow-2xl">
      <table className="min-w-full">
        <thead className="bg-white/30 backdrop-blur-xl">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-6 py-4 text-left font-semibold text-[#0a324c] tracking-wide uppercase text-sm"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-white/40">{children}</tbody>
      </table>
    </div>
  );
}
