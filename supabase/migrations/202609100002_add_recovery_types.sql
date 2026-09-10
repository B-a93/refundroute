create type public.recovery_type as enum ('subscription', 'online_purchase');

alter table public.cases
add column recovery_type public.recovery_type not null default 'subscription';

alter type public.problem_type add value if not exists 'item_not_received';
alter type public.problem_type add value if not exists 'not_as_described';
alter type public.problem_type add value if not exists 'wrong_amount';
alter type public.problem_type add value if not exists 'cancelled_not_refunded';
alter type public.problem_type add value if not exists 'refund_promised_not_received';
