import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Modal from '../components/Modal.jsx';
import { api } from '../services/api.js';

function feeStatus(fee) {
  const today = new Date().toISOString().slice(0, 10);
  if (fee.outstanding <= 0) return { label: 'Fully Paid', cls: 'badge-success' };
  if (fee.outstanding < fee.amount_due) return { label: 'Partially Paid', cls: 'badge-warning' };
  if (fee.due_date < today) return { label: 'Overdue', cls: 'badge-danger' };
  return { label: 'Unpaid', cls: 'badge-info' };
}

export default function FeesManagement({ user, onLogout }) {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showFeeForm, setShowFeeForm] = useState(false);
  const [feeForm, setFeeForm] = useState({ student_id: '', description: '', amount_due: '', due_date: '' });

  const [payingFee, setPayingFee] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_method: 'cash', payment_date: '' });

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };
  const handleError = (err) => { setError(err.message); setTimeout(() => setError(''), 4000); };

  const loadFees = () => {
    api.getFees().then(setFees).catch(handleError).finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([api.getFees(), api.getStudents()])
      .then(([f, s]) => { setFees(f); setStudents(s); })
      .catch(handleError)
      .finally(() => setLoading(false));
  }, []);

  const createFee = async (e) => {
    e.preventDefault();
    try {
      await api.createFee({ ...feeForm, amount_due: parseFloat(feeForm.amount_due) });
      flash('Fee record created.');
      setShowFeeForm(false);
      setFeeForm({ student_id: '', description: '', amount_due: '', due_date: '' });
      loadFees();
    } catch (err) { handleError(err); }
  };

  const recordPayment = async (e) => {
    e.preventDefault();
    try {
      await api.createPayment({
        fee_id: payingFee.id,
        student_id: payingFee.student_id,
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        payment_date: paymentForm.payment_date || undefined,
      });
      flash('Payment recorded.');
      setPayingFee(null);
      setPaymentForm({ amount: '', payment_method: 'cash', payment_date: '' });
      loadFees();
    } catch (err) { handleError(err); }
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div><p>Loading fees...</p></div>;
  }

  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />
      <div className="page">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1>Fees &amp; Payments</h1>
            <p>Track fee balances and record payments.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowFeeForm(true)}>+ Add Fee</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Description</th>
                <th>Amount Due</th>
                <th>Paid</th>
                <th>Outstanding</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fees.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No fee records.</td></tr>
              ) : (
                fees.map((fee) => {
                  const st = feeStatus(fee);
                  return (
                    <tr key={fee.id}>
                      <td style={{ fontWeight: 600 }}>{fee.student_name}<br /><span style={{ fontSize: 11, color: 'var(--muted)' }}>{fee.student_code}</span></td>
                      <td>{fee.description}</td>
                      <td>₹{parseFloat(fee.amount_due).toLocaleString()}</td>
                      <td>₹{parseFloat(fee.amount_paid || 0).toLocaleString()}</td>
                      <td style={{ fontWeight: 600, color: fee.outstanding > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        ₹{parseFloat(fee.outstanding).toLocaleString()}
                      </td>
                      <td>{fee.due_date}</td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td>
                        {fee.outstanding > 0 && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '6px 12px' }}
                            onClick={() => { setPayingFee(fee); setPaymentForm({ amount: '', payment_method: 'cash', payment_date: '' }); }}
                          >
                            Record Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD FEE MODAL */}
      {showFeeForm && (
        <Modal title="Add Fee Record" onClose={() => setShowFeeForm(false)}>
          <form onSubmit={createFee}>
            <div className="form-group">
              <label>Student</label>
              <select value={feeForm.student_id} onChange={(e) => setFeeForm({ ...feeForm, student_id: e.target.value })} style={selectStyle} required>
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name} ({s.student_code})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input value={feeForm.description} onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })} placeholder="Accommodation - Semester" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Amount Due (₹)</label>
                <input type="number" min="0" step="0.01" value={feeForm.amount_due} onChange={(e) => setFeeForm({ ...feeForm, amount_due: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={feeForm.due_date} onChange={(e) => setFeeForm({ ...feeForm, due_date: e.target.value })} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary">Create Fee</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowFeeForm(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* RECORD PAYMENT MODAL */}
      {payingFee && (
        <Modal title={`Record Payment — ${payingFee.student_name}`} onClose={() => setPayingFee(null)}>
          <p style={{ marginBottom: 16, color: 'var(--secondary)' }}>
            Outstanding: <strong style={{ color: 'var(--danger)' }}>₹{parseFloat(payingFee.outstanding).toLocaleString()}</strong>
          </p>
          <form onSubmit={recordPayment}>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" min="0.01" step="0.01" max={payingFee.outstanding} value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select value={paymentForm.payment_method} onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })} style={selectStyle}>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
              </select>
            </div>
            <div className="form-group">
              <label>Payment Date (optional)</label>
              <input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary">Record Payment</button>
              <button type="button" className="btn btn-ghost" onClick={() => setPayingFee(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

const selectStyle = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' };
