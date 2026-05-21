import { RiArrowDownLine, RiArrowUpLine, RiRefundLine } from 'react-icons/ri';
import { formatCoins, formatDate } from '../../utils/formatters';
import { txnMeta } from '../../utils/helpers';
import Badge from '../common/Badge';

const ICON_MAP = {
  WIN_REWARD:     { icon: RiArrowDownLine, variant: 'primary'   },
  JOIN_DEBIT:     { icon: RiArrowUpLine,   variant: 'secondary' },
  REFUND:         { icon: RiRefundLine,    variant: 'tertiary'  },
  ADMIN_REWARD:   { icon: RiArrowDownLine, variant: 'tertiary'  },
  APP_COMMISSION: { icon: RiArrowDownLine, variant: 'muted'     },
};

export default function TransactionRow({ txn }) {
  const { color, sign, label } = txnMeta(txn.type);
  const meta = ICON_MAP[txn.type] || { icon: RiArrowDownLine, variant: 'muted' };
  const Icon = meta.icon;

  return (
    <tr className="hover:bg-white/[0.025] transition-colors border-b border-outline/50 last:border-0">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded" style={{ background: `${color}18` }}>
            <Icon size={16} style={{ color }} />
          </div>
          <span className="text-sm">{label}</span>
        </div>
      </td>
      <td className="px-5 py-3.5 text-xs text-on-muted font-mono">
        {txn.referenceType}/{txn.referenceId?.slice(-6) || '---'}
      </td>
      <td className="px-5 py-3.5 text-xs text-on-muted">{formatDate(txn.createdAt)}</td>
      <td className="px-5 py-3.5 text-right font-mono font-bold" style={{ color }}>
        {sign}{formatCoins(Math.abs(Number(txn.amount)))}
      </td>
      <td className="px-5 py-3.5 text-right font-mono text-xs text-on-muted">
        {formatCoins(txn.balanceAfter)}
      </td>
      <td className="px-5 py-3.5 text-right">
        <Badge variant={meta.variant}>DONE</Badge>
      </td>
    </tr>
  );
}
