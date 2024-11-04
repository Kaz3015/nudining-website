import React from 'react';
function MacroTable({macros}) {
    const macroEntries = JSON.parse(macros);




  return (
    <ul>
        {Object.keys(macroEntries).map((key) => (
            <li key={key}>
                {key}: {macroEntries[key]}
            </li>
            )
        )}
    </ul>
  );
}

export default MacroTable;
