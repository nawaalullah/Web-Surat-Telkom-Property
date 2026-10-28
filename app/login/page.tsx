
import Logo from '@/components/Logo';
import { login } from '../actions';

import InputPassword from '@/components/InputPassword';
import PesanModal from '@/components/PesanModal';
import TemaMenu from '@/components/TemaMenu';
import HakCipta from '@/components/HakCipta';

const inp =
    'border border-line-strong rounded-lg px-3 py-2.5 text-sm w-full min-h-[44px] mt-1.5 bg-surface';

export default function Login({
    searchParams,
}: {
    searchParams: { error?: string };
}) {
    return (
        <div className="relative isolate min-h-screen flex items-center justify-center p-4 sm:p-6">
            <div className="login-bg" aria-hidden="true" />
            <div className="login-veil" aria-hidden="true" />
            <div className="fixed top-4 right-4 z-40">
                <TemaMenu />
            </div>

            <form
                action={login}
                className="bg-surface/80 backdrop-blur-md border border-line/70 rounded-2xl shadow-xl px-5 py-8 sm:px-10 sm:py-10 w-[420px] max-w-full flex flex-col gap-5"
            >
                <div className="flex flex-col items-center gap-3 pb-5 border-b border-line-soft">
                    <div><Logo className="w-[200px] sm:w-[220px] max-w-full h-auto" /></div>

                    <div className="text-sm text-muted text-center">
                       Arsip Surat Keluar Telkom Property Area Bandung
                    </div>
                </div>

                <h1 className="m-0 text-[22px] font-bold text-center">
                    Masuk
                </h1>

                {searchParams.error && (
                    <PesanModal
                        tipe="error"
                        judul={searchParams.error === '2' ? 'Terlalu Banyak Percobaan' : 'Login Gagal'}
                        pesan={
                            searchParams.error === '2'
                                ? 'Terlalu banyak percobaan login yang gagal. Coba lagi sekitar 15 menit lagi.'
                                : 'Username atau password salah.'
                        }
                        hapusParam={['error']}
                    />
                )}

                <label className="block text-[13px] font-bold">
                    Username

                    <input
                        name="username"
                        className={inp}
                        autoComplete="username"
                        required
                    />
                </label>

                <label className="block text-[13px] font-bold">
                    Password

                    <InputPassword
                        name="password"
                        className={inp}
                        autoComplete="current-password"
                        required
                    />
                </label>

                <button className="min-h-[48px] rounded-lg font-bold text-sm bg-brand text-white cursor-pointer">
                    Masuk
                </button>

                <HakCipta className="pt-4 border-t border-line-soft" />
            </form>
        </div>
    );
}
