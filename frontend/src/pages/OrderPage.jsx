import React, { useEffect, useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import HoverPopup from '../components/HoverPopup';
import ItemGroupCard from '../components/ItemGroupCard';

export default function OrderPage(){
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [orderId, setOrderId] = useState(null);
  const [hover, setHover] = useState({show:false, x:0, y:0, item:null});

  useEffect(()=> {
    api.get('/items').then(r=>setItems(r.data)).catch(console.error);
    api.get('/item-groups').then(r=>setGroups(r.data)).catch(console.error);
  }, []);

  const createOrder = async () => {
    // create empty order for current user (in real app, persist user + auth)
    const resp = await api.post('/orders', { event_id: 1, items: [] }).catch(e => { console.error(e); return null; });
    if(resp && resp.data) setOrderId(resp.data.orderId);
  };

  const addGroup = async (groupId) => {
    if(!orderId) {
      await createOrder();
      // fetch new id
    }
    // ensure orderId now exists
    if(!orderId) return alert('Failed to create order first');
    await api.post(`/orders/${orderId}/add-group/${groupId}`).then(()=> alert('Group added')).catch(e => alert(e.response?.data?.error || e.message));
  };

  return (
    <div>
      <h2>Create / Edit Order</h2>
      <div style={{display:'flex', gap:20}}>
        <div style={{flex:2}}>
          <h3>Item groups</h3>
          <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
            {groups.map(g => <ItemGroupCard key={g.id} group={g} onAdd={() => addGroup(g.id)} />)}
          </div>
        </div>

        <div style={{flex:3}}>
          <h3>All items</h3>
          <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8}}>
            {items.map(it => (
              <div key={it.id} style={{padding:8, border:'1px solid #eee', position:'relative'}}>
                <div
                  onMouseEnter={(e)=> setHover({show:true, x:e.clientX, y:e.clientY, item:it})}
                  onMouseLeave={()=> setHover({show:false, item:null})}
                >
                  {it.name}
                </div>
                <div style={{fontSize:12, color:'#666'}}>Stock: {it.available_stock}</div>
                {hover.show && hover.item?.id === it.id ? (
                  <div style={{position:'relative'}}>
                    <div style={{position:'absolute', left:10, top:20, zIndex:999}}>
                      <HoverPopup item={it} />
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{marginTop:20}}>
        <button onClick={createOrder}>Create empty order</button>
        {orderId && <div>Order ID: {orderId} — <Link to={`/order/${orderId}`}>Open</Link></div>}
      </div>
    </div>
  );
}
