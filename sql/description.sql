select *,
    balance / 100.0 as eur_balance
from (
        select *,
            amount * iif(`from` = 'NULL', 1, -1) / 100.0 as eur_with_sign,
            sum(amount * iif(`from` = 'NULL', 1, -1)) over (
                order by date(`date`),
                    id
            ) as balance
        from transactions
        where description like 'bbq cumple rafa%'
    );