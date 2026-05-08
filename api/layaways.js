import { withMiddleware } from './lib/middleware.js';
import { getDb } from './lib/firebase-admin.js';

export default withMiddleware(async (req, res) => {
    const db = getDb();

    if (req.method === 'POST') {
        const { customer, items, service, totalAmount, downPayment, paymentRef, installments } = req.body;

        if (!customer?.phone || !customer?.email || !totalAmount) {
            return res.status(400).json({ error: 'Missing required layaway fields' });
        }

        if (paymentRef) {
            const txResponse = await fetch(
                `https://api.flutterwave.com/v3/transactions/${paymentRef}/verify`,
                { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
            );
            const txData = await txResponse.json();

            if (txData.status !== 'success' || txData.data?.status !== 'successful') {
                return res.status(400).json({ error: 'Payment verification failed' });
            }
        }

        const layawayId = `LAY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const paidAmount = Number(downPayment || 0);

        await db.collection('layaways').doc(layawayId).set({
            layawayId,
            customer,
            items: items || (service ? [service] : []),
            totalAmount: Number(totalAmount),
            paidAmount: paidAmount,
            remainingAmount: Number(totalAmount) - paidAmount,
            installments: installments || 3,
            payments: paymentRef ? [{
                amount: paidAmount,
                ref: String(paymentRef),
                date: Date.now(),
                type: 'down_payment',
            }] : [],
            status: 'active',
            createdAt: Date.now(),
        });

        return res.status(201).json({ success: true, layawayId });
    }

    if (req.method === 'GET') {
        const { id, phone, email } = req.query;

        if (id) {
            const doc = await db.collection('layaways').doc(id).get();
            if (!doc.exists) return res.status(404).json({ error: 'Layaway not found' });
            return res.status(200).json({ id: doc.id, ...doc.data() });
        }

        if (phone || email) {
            let query = db.collection('layaways');
            if (phone) query = query.where('customer.phone', '==', phone);
            if (email) query = query.where('customer.email', '==', email.toLowerCase());
            const snap = await query.get();
            const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            return res.status(200).json(results);
        }

        return res.status(400).json({ error: 'Provide an ID, phone, or email' });
    }

    if (req.method === 'PUT') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Layaway ID required' });

        const { amount, paymentRef: pRef } = req.body;
        if (!amount || !pRef) return res.status(400).json({ error: 'Amount and payment reference required' });

        // Verify payment first
        const txResponse = await fetch(
            `https://api.flutterwave.com/v3/transactions/${pRef}/verify`,
            { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
        );
        const txData = await txResponse.json();

        if (txData.status !== 'success' || txData.data?.status !== 'successful') {
            return res.status(400).json({ error: 'Payment verification failed' });
        }

        if (Number(txData.data.amount) < Number(amount)) {
            return res.status(400).json({ error: 'Payment amount mismatch' });
        }

        const doc = await db.collection('layaways').doc(id).get();
        if (!doc.exists) return res.status(404).json({ error: 'Layaway not found' });

        const data = doc.data();
        const paidAmount = (data.paidAmount || data.downPayment || 0) + Number(amount);
        const remainingAmount = data.totalAmount - paidAmount;

        const update = {
            paidAmount: paidAmount,
            remainingAmount: Math.max(0, remainingAmount),
            payments: [...(data.payments || []), {
                amount: Number(amount),
                ref: String(pRef),
                date: Date.now(),
                type: 'installment',
            }],
        };

        if (remainingAmount <= 0) update.status = 'completed';

        await db.collection('layaways').doc(id).update(update);
        return res.status(200).json({ success: true, remainingAmount: Math.max(0, remainingAmount) });
    }

    return res.status(405).json({ error: 'Method not allowed' });
});
