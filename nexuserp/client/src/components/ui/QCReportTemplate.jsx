import React from 'react';

export default function QCReportTemplate({ report }) {
    if (!report) return null;
    const { qcNo, grn, template, parameters, result, passOrFail, createdAt } = report;
    const parsedParams = typeof parameters === 'string' ? JSON.parse(parameters) : (parameters || {});
    const parsedFields = template?.fields ? (typeof template.fields === 'string' ? JSON.parse(template.fields) : template.fields) : [];

    return (
        <div className="bg-white p-8 text-black font-sans text-xs leading-relaxed border-2 border-black">
            <div className="flex flex-col items-center mb-6 border-b-2 border-black pb-4">
                <h1 className="text-2xl font-black uppercase tracking-tighter">Nu-Cork Products Private Limited</h1>
                <p className="font-bold text-gray-700">QUALITY CONTROL INSPECTION REPORT</p>
                <p className="text-[10px] mt-1 font-bold">Bhiwadi - 301019, Rajasthan</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 border-b border-gray-200 pb-4">
                <div className="space-y-1">
                    <div className="flex"><span className="w-24 font-bold text-gray-500 uppercase">QC No</span> <span className="font-bold">: {qcNo}</span></div>
                    <div className="flex"><span className="w-24 font-bold text-gray-500 uppercase">Stage</span> <span className="font-bold">: {report.stage}</span></div>
                    <div className="flex"><span className="w-24 font-bold text-gray-500 uppercase">Template</span> <span className="font-bold">: {template?.name}</span></div>
                </div>
                <div className="space-y-1 text-right">
                    <div className="flex justify-end"><span className="w-24 font-bold text-gray-500 uppercase text-left">Date</span> <span className="font-bold">: {createdAt?.slice(0, 10)}</span></div>
                    <div className="flex justify-end"><span className="w-24 font-bold text-gray-500 uppercase text-left">GRN No</span> <span className="font-bold">: {grn?.grnNo}</span></div>
                    <div className="flex justify-end"><span className="w-24 font-bold text-gray-500 uppercase text-left">Vendor</span> <span className="font-bold">: {grn?.po?.vendor?.companyName}</span></div>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-sm font-bold uppercase border-b border-black mb-3 pb-1 bg-gray-50 px-2">Inspection Parameters & Results</h3>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100 uppercase text-[9px] font-black">
                            <th className="border border-black px-3 py-2 text-left">Parameter Name</th>
                            <th className="border border-black px-3 py-2 text-center w-20">Unit</th>
                            <th className="border border-black px-3 py-2 text-center w-32">Standard / Range</th>
                            <th className="border border-black px-3 py-2 text-center w-40">Observation</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parsedFields.length > 0 ? parsedFields.map((f, idx) => (
                            <tr key={idx} className="h-10">
                                <td className="border border-black px-3 py-1 font-bold uppercase">
                                    {f.label}
                                    {f.method && <p className="text-[7px] font-bold text-gray-400 mt-0.5">Method: {f.method}</p>}
                                </td>
                                <td className="border border-black px-3 py-1 text-center font-bold text-gray-500">{f.unit || '—'}</td>
                                <td className="border border-black px-3 py-1 text-center font-mono font-bold text-gray-500">
                                    {f.type === 'MIN_ONLY' ? `≥ ${f.min}` : 
                                     f.type === 'MAX_ONLY' ? `≤ ${f.max}` : 
                                     f.type === 'FIXED' ? f.min : 
                                     `${f.min}-${f.max}`}
                                    {f.instrument && <p className="text-[7px] font-bold text-gray-400">via {f.instrument}</p>}
                                </td>
                                <td className="border border-black px-3 py-1 text-center font-black text-xs">{parsedParams[f.label] || '—'}</td>
                            </tr>
                        )) : Object.entries(parsedParams || {}).map(([key, val], idx) => (
                            <tr key={idx} className="h-10">
                                <td className="border border-black px-3 py-1 font-bold uppercase">{key}</td>
                                <td className="border border-black px-3 py-1 text-center font-bold text-gray-500">—</td>
                                <td className="border border-black px-3 py-1 text-center font-mono font-bold text-gray-500">—</td>
                                <td className="border border-black px-3 py-1 text-center font-black text-xs">{val}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-8">
                <div className="border border-black p-4 rounded-sm">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Overall Remarks</h4>
                    <p className="text-sm font-bold min-h-[40px] uppercase">{result || 'NO REMARKS PROVIDED'}</p>
                </div>
                
                <div className={`border-2 p-4 rounded-sm flex items-center justify-between ${passOrFail ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'}`}>
                    <span className="text-sm font-bold uppercase">Final Quality Decision</span>
                    <span className={`text-xl font-black px-6 py-2 rounded border-2 ${passOrFail ? 'bg-green-600 text-white border-green-600' : 'bg-red-600 text-white border-red-600'}`}>
                        {passOrFail ? '✓ ACCEPTED' : '✗ REJECTED'}
                    </span>
                </div>
            </div>

            <div className="mt-20 flex justify-between items-end px-10">
                <div className="text-center border-t border-black w-48 pt-2 font-bold uppercase text-[9px] tracking-widest">Quality Inspector</div>
                <div className="text-center border-t border-black w-48 pt-2 font-bold uppercase text-[9px] tracking-widest">Store Manager</div>
            </div>

            <div className="mt-8 text-[8px] text-gray-400 text-center uppercase">
                * This is an electronically generated QC report by NexusERP System *
            </div>
        </div>
    );
}
