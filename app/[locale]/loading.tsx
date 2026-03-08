export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#003459] to-[#00A8E8] flex items-center justify-center animate-pulse">
                    <span className="text-lg font-black text-white">NC</span>
                </div>
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00A8E8]"></div>
            </div>
        </div>
    );
}
