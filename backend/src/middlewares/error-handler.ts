import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export function errorHandler(error: FastifyError, req: FastifyRequest, reply: FastifyReply) {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Erro de validação',
      details: error.errors.map(err => ({
        campo: err.path.join('.'),
        mensagem: err.message,
      })),
    });
  }

  // Erros comuns de chave estrangeira do postgres
  if ((error as any).code === '23503') {
    return reply.status(400).send({
      error: 'Operação inválida. O registro possui dependências vinculadas ou a referência não existe.',
    });
  }

  // Erros de violação única
  if ((error as any).code === '23505') {
    return reply.status(409).send({
      error: 'Já existe um registro com os mesmos dados únicos.',
    });
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Ocorreu um erro interno no servidor.';

  if (statusCode >= 500) {
    req.log.error(error);
  }

  return reply.status(statusCode).send({
    error: message,
  });
}
