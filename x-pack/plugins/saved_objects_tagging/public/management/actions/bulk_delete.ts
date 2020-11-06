/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { OverlayStart, NotificationsStart } from 'src/core/public';
import { i18n } from '@kbn/i18n';
import { ITagInternalClient } from '../../tags';
import { TagBulkAction } from '../types';

interface GetBulkDeleteActionOptions {
  overlays: OverlayStart;
  notifications: NotificationsStart;
  tagClient: ITagInternalClient;
}

export const getBulkDeleteAction = ({
  overlays,
  notifications,
  tagClient,
}: GetBulkDeleteActionOptions): TagBulkAction => {
  return {
    id: 'delete',
    label: i18n.translate('xpack.savedObjectsTagging.management.actions.bulkDelete.label', {
      defaultMessage: 'Delete',
    }),
    icon: 'trash',
    refreshAfterExecute: true,
    execute: async (tagIds) => {
      const confirmed = await overlays.openConfirm(
        i18n.translate('xpack.savedObjectsTagging.management.actions.bulkDelete.confirm.text', {
          defaultMessage:
            'By deleting {count, plural, one {this tag} other {these tags}}, you will no longer be able to assign {count, plural, one {it} other {them}} to saved objects. ' +
            '{count, plural, one {This tag} other {These tags}} will be removed from any saved objects that currently use {count, plural, one {it} other {them}}. ' +
            'Are you sure you wish to proceed?',
          values: {
            count: tagIds.length,
          },
        }),
        {
          title: i18n.translate(
            'xpack.savedObjectsTagging.management.actions.bulkDelete.confirm.title',
            {
              defaultMessage: 'Delete {count, plural, one {1 tag} other {# tags}}',
              values: {
                count: tagIds.length,
              },
            }
          ),
          confirmButtonText: i18n.translate(
            'xpack.savedObjectsTagging.management.actions.bulkDelete.confirm.confirmButtonText',
            {
              defaultMessage: 'Delete {count, plural, one {tag} other {tags}}',
              values: {
                count: tagIds.length,
              },
            }
          ),
          buttonColor: 'danger',
        }
      );

      if (confirmed) {
        await tagClient.bulkDelete(tagIds);

        notifications.toasts.addSuccess({
          title: i18n.translate(
            'xpack.savedObjectsTagging.management.actions.bulkDelete.notification.successTitle',
            {
              defaultMessage: 'Deleted {count, plural, one {1 tag} other {# tags}}',
              values: {
                count: tagIds.length,
              },
            }
          ),
        });
      }
    },
  };
};
