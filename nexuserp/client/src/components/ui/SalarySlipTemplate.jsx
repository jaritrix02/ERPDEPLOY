import React from 'react';

export default function SalarySlipTemplate({ form, monthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] }) {
    if (!form) return null;
    const employee = form.employee || {};
    
    return (
        <div className="bg-white p-10 border-[3px] border-black text-black font-sans text-[11px] leading-tight mx-auto max-w-4xl min-h-[842px] flex flex-col shadow-2xl relative overflow-hidden print:p-8 print:border-[2px] print:shadow-none">
            {/* Elegant Background Watermark (Only for screen, subtle in print) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none z-0">
                <h1 className="text-[120px] font-black rotate-[-35deg] uppercase">NU-CORK</h1>
            </div>

            {/* Premium Header */}
            <div className="relative z-10 flex flex-col items-center mb-8 border-b-2 border-black pb-6">
                <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mb-4 text-3xl font-black shadow-lg">NC</div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-center">Nu-Cork Products Private Limited</h1>
                <p className="font-bold text-slate-600 text-[10px] uppercase tracking-wider text-center max-w-md mt-1">Plot No. E-370, Phase - 1, RIICO Industrial Area, Bhiwadi - 301019, Rajasthan</p>
                
                <div className="mt-6 inline-block bg-black text-white px-8 py-2 rounded-full font-black uppercase tracking-[0.2em] text-[10px] shadow-xl">
                    Salary Slip: {monthsList[form.month - 1] || '---'} {form.year}
                </div>
            </div>

            {/* Personnel Intelligence Context */}
            <div className="relative z-10 grid grid-cols-2 gap-x-12 gap-y-2 mb-8 bg-slate-50 border-y border-black/10 p-6 rounded-2xl">
                <div className="space-y-2">
                    <div className="flex justify-between border-b border-black/5 pb-1"><span className="font-black text-slate-400 uppercase text-[9px]">Paycode</span> <span className="font-bold text-black">{employee.employeeCode}</span></div>
                    <div className="flex justify-between border-b border-black/5 pb-1"><span className="font-black text-slate-400 uppercase text-[9px]">Full Name</span> <span className="font-bold text-black">{employee.name}</span></div>
                    <div className="flex justify-between border-b border-black/5 pb-1"><span className="font-black text-slate-400 uppercase text-[9px]">Department</span> <span className="font-bold text-black">{employee.department}</span></div>
                    <div className="flex justify-between border-b border-black/5 pb-1"><span className="font-black text-slate-400 uppercase text-[9px]">Designation</span> <span className="font-bold text-black">{employee.designation}</span></div>
                    <div className="flex justify-between border-b border-black/5 pb-1"><span className="font-black text-slate-400 uppercase text-[9px]">Aadhar No</span> <span className="font-bold font-mono">{employee.aadharNumber}</span></div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between border-b border-black/5 pb-1"><span className="font-black text-slate-400 uppercase text-[9px]">Bank Account</span> <span className="font-bold font-mono">{employee.accountNo}</span></div>
                    <div className="flex justify-between border-b border-black/5 pb-1"><span className="font-black text-slate-400 uppercase text-[9px]">Bank Name</span> <span className="font-bold text-black uppercase">{employee.bankName}</span></div>
                    <div className="flex justify-between border-b border-black/5 pb-1"><span className="font-black text-slate-400 uppercase text-[9px]">IFSC Code</span> <span className="font-bold font-mono uppercase">{employee.ifscCode}</span></div>
                    <div className="flex justify-between border-b border-black/5 pb-1"><span className="font-black text-slate-400 uppercase text-[9px]">PAN Card</span> <span className="font-bold font-mono uppercase">{employee.panNumber}</span></div>
                    <div className="flex justify-between border-b border-black/5 pb-1"><span className="font-black text-slate-400 uppercase text-[9px]">UAN Number</span> <span className="font-bold font-mono">{employee.uanNumber}</span></div>
                </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="relative z-10 flex border-2 border-black rounded-xl overflow-hidden flex-1 shadow-sm">
                {/* Earnings Column */}
                <div className="flex-1 border-r-2 border-black flex flex-col">
                    <div className="bg-slate-900 text-white px-4 py-2 font-black uppercase text-[10px] tracking-widest text-center">Earnings Component</div>
                    <table className="w-full text-[10px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-black font-black uppercase text-[8px] text-slate-500">
                                <th className="px-4 py-2 text-left">Description</th>
                                <th className="px-4 py-2 text-right">Structure</th>
                                <th className="px-4 py-2 text-right">Arrear</th>
                                <th className="px-4 py-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {[
                                { h: 'BASIC', v: form.basic, a: form.basicArrear },
                                { h: 'HRA', v: form.hra, a: form.hraArrear },
                                { h: 'CONVEYANCE', v: form.conveyance, a: form.conveyanceArrear },
                                { h: 'OVERTIME (OT)', v: form.ot, a: form.otArrear },
                                { h: 'SPL ALLOWANCE', v: form.spl, a: form.splArrear },
                                { h: 'INCENTIVE', v: form.incentive, a: form.incentiveArrear },
                                { h: 'PROD. INC', v: form.proInc, a: form.proIncArrear },
                                { h: 'TEA ALLOWANCE', v: form.tea, a: form.teaArrear },
                                { h: 'ADV. AG. INCEN.', v: form.advAgIncen, a: form.advAgIncenArrear },
                                { h: 'OTHER EARNINGS', v: form.other, a: form.otherArrear },
                            ].filter(row => row.v > 0 || row.a > 0).map(row => (
                                <tr key={row.h} className="font-bold text-slate-800">
                                    <td className="px-4 py-2.5 uppercase font-black text-black">{row.h}</td>
                                    <td className="px-4 py-2.5 text-right">₹{Number(row.v || 0).toFixed(2)}</td>
                                    <td className="px-4 py-2.5 text-right text-amber-600">₹{Number(row.a || 0).toFixed(2)}</td>
                                    <td className="px-4 py-2.5 text-right font-black">₹{(Number(row.v || 0) + Number(row.a || 0)).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-auto bg-slate-50 border-t-2 border-black px-4 py-3 flex justify-between items-center">
                        <span className="font-black uppercase text-[10px] tracking-widest text-slate-500">Gross Earnings</span>
                        <span className="font-black text-lg">₹{(Number(form.totalEarnings) || 0).toFixed(2)}</span>
                    </div>
                </div>

                {/* Deductions Column */}
                <div className="w-[40%] flex flex-col">
                    <div className="bg-rose-900 text-white px-4 py-2 font-black uppercase text-[10px] tracking-widest text-center">Deduction Component</div>
                    <table className="w-full text-[10px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-black font-black uppercase text-[8px] text-slate-500">
                                <th className="px-4 py-2 text-left">Description</th>
                                <th className="px-4 py-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {[
                                { h: 'TDS (TAX)', v: form.tds },
                                { h: 'PROV. FUND (PF)', v: form.pf },
                                { h: 'ESI COMP.', v: form.esi },
                                { h: 'LOAN RECOVERY', v: form.loan },
                                { h: 'SALARY ADVANCE', v: form.advance },
                                { h: 'PF ADDITIONAL', v: form.pfAdditional },
                                { h: 'TDS EXTRA', v: form.tdsExtra }
                            ].filter(row => row.v > 0).map((row, i) => (
                                <tr key={i} className="font-bold text-slate-800">
                                    <td className="px-4 py-2.5 uppercase font-black text-rose-600">{row.h}</td>
                                    <td className="px-4 py-2.5 text-right font-black">₹{Number(row.v || 0).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div className="bg-slate-50 border-t-2 border-black px-4 py-3 flex justify-between items-center mt-auto">
                        <span className="font-black uppercase text-[10px] tracking-widest text-slate-500">Total Deduct</span>
                        <span className="font-black text-lg text-rose-600">₹{(Number(form.totalDeductions) || 0).toFixed(2)}</span>
                    </div>

                    <div className="border-t-2 border-black p-5 bg-white font-bold">
                        <p className="border-b border-black/10 mb-3 text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Monthly Attendance</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[9px]">
                            <div className="flex justify-between border-b border-black/5 pb-1"><span className="text-slate-500">PRESENT</span> <span className="font-black">{form.present}</span></div>
                            <div className="flex justify-between border-b border-black/5 pb-1"><span className="text-slate-500">WEEKOFF</span> <span className="font-black">{form.weekOff}</span></div>
                            <div className="flex justify-between border-b border-black/5 pb-1"><span className="text-slate-500">HOLIDAY</span> <span className="font-black">{form.holiday}</span></div>
                            <div className="flex justify-between border-b border-black/5 pb-1"><span className="text-slate-500">OT HOURS</span> <span className="font-black">{form.oThrs}</span></div>
                            <div className="flex justify-between border-b border-black/5 pb-1"><span className="text-slate-500">ABSENT</span> <span className="font-black">{form.totAbs}</span></div>
                            <div className="flex justify-between border-b border-black/5 pb-1"><span className="text-slate-500">LEAVE</span> <span className="font-black">{form.leave}</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Net Pay Highlight */}
            <div className="relative z-10 mt-8 flex justify-between items-center bg-black text-white p-6 rounded-2xl shadow-2xl overflow-hidden">
                <div className="absolute right-0 top-0 h-full w-32 bg-white/5 skew-x-[-20deg] translate-x-16 pointer-events-none"></div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">Net Disbursement Amount</p>
                    <p className="text-4xl font-black tracking-tight">₹{(Number(form.netPayable) || 0).toLocaleString()}</p>
                </div>
                <div className="text-right border-l border-white/20 pl-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">Payable Days</p>
                    <p className="text-2xl font-black">{form.payDays || 0} <span className="text-xs text-white/40 font-bold">DAYS</span></p>
                </div>
            </div>

            {/* Signature Block */}
            <div className="relative z-10 mt-auto pt-20 flex justify-between px-10">
                <div className="text-center w-56">
                    <div className="h-1 border-t border-black mb-2 shadow-sm"></div>
                    <p className="text-[9px] font-black uppercase tracking-widest">Employee Signature</p>
                    <p className="text-[7px] text-slate-400 font-bold mt-1">(Acknowledgement of Receipt)</p>
                </div>
                <div className="text-center w-56">
                    <div className="h-1 border-t border-black mb-2 shadow-sm"></div>
                    <p className="text-[9px] font-black uppercase tracking-widest">Authorized Signatory</p>
                    <p className="text-[7px] text-slate-400 font-bold mt-1">(For Nu-Cork Products Pvt Ltd)</p>
                </div>
            </div>
            
            <div className="relative z-10 mt-8 text-[8px] text-slate-400 text-center font-bold uppercase tracking-widest border-t border-black/5 pt-4">
                * This is a system-generated electronic document. Verification can be performed via the NexusERP Portal *
            </div>
        </div>
    );
}
