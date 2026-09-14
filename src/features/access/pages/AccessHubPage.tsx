import React from "react";
import { MasterDrivenAccessHub } from "./MasterDrivenAccessHub";

export const MyAccessHub: React.ComponentProps<typeof MasterDrivenAccessHub> = (props) => (
  <div className="access-master-form">
    <style>{`.access-master-form h3 > span:first-child { display: none; }`}</style>
    <MasterDrivenAccessHub {...props} />
  </div>
);
