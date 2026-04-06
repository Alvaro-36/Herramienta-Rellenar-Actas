/**
 * Middleware que restringe el acceso a solo peticiones originadas desde localhost.
 *
 * Comprueba primero el header X-Forwarded-For (presente cuando el servidor esta
 * detras de un proxy inverso como nginx). Si el header existe, se toma la primera
 * IP de la cadena (la del cliente original) y se verifica que sea local.
 *
 * ATENCION: Si el servidor esta expuesto a internet a traves de un proxy inverso,
 * el header X-Forwarded-For puede ser falsificado por el cliente si el proxy no
 * lo sobreescribe explicitamente. Asegurate de que tu proxy este configurado para
 * establecer siempre ese header con la IP real del cliente.
 */
function soloLocalhost(req, res, next) {
    const IPS_LOCALES = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

    const forwarded = req.headers['x-forwarded-for'];
    const ipCliente = forwarded
        ? forwarded.split(',')[0].trim()
        : req.socket.remoteAddress;

    if (!IPS_LOCALES.includes(ipCliente)) {
        return res.status(403).json({ error: 'Acceso denegado.' });
    }

    next();
}

module.exports = soloLocalhost;
