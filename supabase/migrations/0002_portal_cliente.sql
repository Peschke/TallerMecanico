-- =============================================================================
-- 0002 · Portal Cliente (Módulo 9)
-- Agrega dos RPC acotadas para el cliente autenticado. No modifica tablas ni políticas:
-- las políticas RLS de clientes y notificaciones siguen sin permitir UPDATE al cliente,
-- y estas funciones solo tocan su propia fila y columnas permitidas (RNF11).
-- =============================================================================

-- Perfil: el cliente actualiza correo y teléfono. El RUT y el nombre no se pueden cambiar.
create or replace function public.actualizar_contacto_cliente(p_correo text, p_telefono text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_id   uuid := privado.cliente_actual();
  v_tel  text := regexp_replace(coalesce(p_telefono, ''), '[^0-9+]', '', 'g');
  v_mail text := nullif(lower(trim(coalesce(p_correo, ''))), '');
  r      public.clientes%rowtype;
begin
  if v_id is null then
    raise exception 'Solo el cliente titular puede actualizar sus datos' using errcode = '42501';
  end if;
  if length(regexp_replace(v_tel, '[^0-9]', '', 'g')) not between 8 and 12 then
    raise exception 'Ingrese un teléfono válido (8 a 12 dígitos)' using errcode = 'P0001';
  end if;
  if v_mail is not null and v_mail !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Ingrese un correo válido' using errcode = 'P0001';
  end if;
  update public.clientes set correo = v_mail, telefono = v_tel where id = v_id returning * into r;
  return jsonb_build_object('id', r.id, 'rut', r.rut, 'nombre', r.nombre, 'telefono', r.telefono, 'correo', r.correo);
end $$;

-- Notificaciones: el cliente marca como leídas las que le fueron enviadas.
-- p_ids null = todas las pendientes de lectura.
create or replace function public.marcar_notificaciones_cliente(p_ids uuid[] default null)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_id uuid := privado.cliente_actual(); v_n integer;
begin
  if v_id is null then raise exception 'Sin permiso' using errcode = '42501'; end if;
  update public.notificaciones set leida_en = now()
  where destinatario_cliente_id = v_id and leida_en is null and (p_ids is null or id = any(p_ids));
  get diagnostics v_n = row_count;
  return v_n;
end $$;

revoke execute on function public.actualizar_contacto_cliente(text, text), public.marcar_notificaciones_cliente(uuid[]) from public, anon;
grant execute on function public.actualizar_contacto_cliente(text, text), public.marcar_notificaciones_cliente(uuid[]) to authenticated;
