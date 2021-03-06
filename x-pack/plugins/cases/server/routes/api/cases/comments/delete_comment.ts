/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import Boom from '@hapi/boom';
import { schema } from '@kbn/config-schema';

import { CASE_SAVED_OBJECT, SUB_CASE_SAVED_OBJECT } from '../../../../saved_object_types';
import { buildCommentUserActionItem } from '../../../../services/user_actions/helpers';
import { RouteDeps } from '../../types';
import { wrapError } from '../../utils';
import { CASE_COMMENT_DETAILS_URL, ENABLE_CASE_CONNECTOR } from '../../../../../common/constants';

export function initDeleteCommentApi({
  caseService,
  router,
  userActionService,
  logger,
}: RouteDeps) {
  router.delete(
    {
      path: CASE_COMMENT_DETAILS_URL,
      validate: {
        params: schema.object({
          case_id: schema.string(),
          comment_id: schema.string(),
        }),
        query: schema.maybe(
          schema.object({
            subCaseId: schema.maybe(schema.string()),
          })
        ),
      },
    },
    async (context, request, response) => {
      try {
        if (!ENABLE_CASE_CONNECTOR && request.query?.subCaseId !== undefined) {
          throw Boom.badRequest(
            'The `subCaseId` is not supported when the case connector feature is disabled'
          );
        }

        const client = context.core.savedObjects.client;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { username, full_name, email } = await caseService.getUser({ request });
        const deleteDate = new Date().toISOString();

        const myComment = await caseService.getComment({
          client,
          commentId: request.params.comment_id,
        });

        if (myComment == null) {
          throw Boom.notFound(`This comment ${request.params.comment_id} does not exist anymore.`);
        }

        const type = request.query?.subCaseId ? SUB_CASE_SAVED_OBJECT : CASE_SAVED_OBJECT;
        const id = request.query?.subCaseId ?? request.params.case_id;

        const caseRef = myComment.references.find((c) => c.type === type);
        if (caseRef == null || (caseRef != null && caseRef.id !== id)) {
          throw Boom.notFound(
            `This comment ${request.params.comment_id} does not exist in ${id}).`
          );
        }

        await caseService.deleteComment({
          client,
          commentId: request.params.comment_id,
        });

        await userActionService.postUserActions({
          client,
          actions: [
            buildCommentUserActionItem({
              action: 'delete',
              actionAt: deleteDate,
              actionBy: { username, full_name, email },
              caseId: id,
              subCaseId: request.query?.subCaseId,
              commentId: request.params.comment_id,
              fields: ['comment'],
            }),
          ],
        });

        return response.noContent();
      } catch (error) {
        logger.error(
          `Failed to delete comment in route case id: ${request.params.case_id} comment id: ${request.params.comment_id} sub case id: ${request.query?.subCaseId}: ${error}`
        );
        return response.customError(wrapError(error));
      }
    }
  );
}
