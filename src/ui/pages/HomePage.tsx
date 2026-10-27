import { motion } from 'framer-motion';
import { SUIT_SYMBOLS } from '../../engine/suits';

export function HomePage() {
  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <motion.h1
        className="text-3xl font-bold"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Bridge Declarer Trainer
      </motion.h1>
      <p className="text-lg text-white/80">ฝึกเดินไพ่ฝั่ง declarer — กำลังสร้าง</p>
      <p className="text-4xl tracking-widest" aria-label="สัญลักษณ์ดอกไพ่">
        {SUIT_SYMBOLS.map(({ suit, symbol, red }) => (
          <span key={suit} className={red ? 'text-red-400' : 'text-white'}>
            {symbol}
          </span>
        ))}
      </p>
    </main>
  );
}
