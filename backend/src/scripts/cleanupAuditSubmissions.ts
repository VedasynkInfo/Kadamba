import mongoose from 'mongoose';

/**
 * Remove the records written by the end-to-end form audit.
 *
 * Only rows carrying the `Audit Contact` / `Audit Consultation` marker or an
 * `audit.*@example.com` address are touched, so the studio's real leads are
 * never in scope.
 */
async function main() {
  const { connectDB, disconnectDB } = await import('../config/database');
  await connectDB();
  const db = mongoose.connection.db!;

  const leads = await db.collection('leads').find({ email: /^audit\./i }).toArray();
  const orderIds = leads.map((lead) => lead.orderId).filter(Boolean);
  const orders = await db.collection('orders').find({ _id: { $in: orderIds } }).toArray();
  const customerIds = orders.map((order) => order.customerId).filter(Boolean);

  const orderResult = await db.collection('orders').deleteMany({ _id: { $in: orderIds } });
  const leadResult = await db.collection('leads').deleteMany({ _id: { $in: leads.map((lead) => lead._id) } });
  const customerResult = await db.collection('customers').deleteMany({
    _id: { $in: customerIds },
    email: /^audit\./i,
  });
  const outboxResult = await db.collection('emailoutboxes').deleteMany({
    $or: [
      { to: /^audit\./i },
      { subject: /Audit (Contact|Consultation)/i },
      { text: /Audit (Contact|Consultation)|audit\.(contact|consult)\./i },
      { html: /Audit (Contact|Consultation)|audit\.(contact|consult)\./i },
    ],
  });

  console.log(
    `Removed ${leadResult.deletedCount} lead(s), ${orderResult.deletedCount} order(s), ` +
      `${customerResult.deletedCount} customer stub(s) and ${outboxResult.deletedCount} outbox row(s).`,
  );

  await disconnectDB();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
