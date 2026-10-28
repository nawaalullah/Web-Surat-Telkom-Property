export const inp = 'border border-line-strong rounded-lg px-3 py-2.5 text-sm w-full min-h-[44px] mt-1.5 bg-surface';
export default function Field({ name, label, def, type = 'text', req, ph }: { name: string; label: string; def?: any; type?: string; req?: boolean; ph?: string }) {
  return <label className="block text-[13px] font-bold">{label}<input name={name} type={type} defaultValue={def ?? ''} required={req} placeholder={ph} className={inp + ' font-semibold placeholder:font-normal placeholder:text-faint'} /></label>;
}
